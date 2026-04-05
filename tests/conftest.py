import io
import sys
import tempfile
import shutil
import uuid
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


REPO_ROOT = Path(__file__).resolve().parents[1]
REMEMORY_ROOT = REPO_ROOT / "rememory"
TEST_OUTPUT_ROOT = Path.home() / ".codex" / "memories" / "bookprintapi-python-sdk-tests"

if str(REMEMORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REMEMORY_ROOT))
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import config  # noqa: E402
import database  # noqa: E402
import models  # noqa: E402
from routes import interviews, orders, projects  # noqa: E402


@pytest.fixture
def workspace_tmp_dir():
    base_dir = TEST_OUTPUT_ROOT
    base_dir.mkdir(parents=True, exist_ok=True)
    temp_dir = base_dir / f"case-{uuid.uuid4().hex}"
    temp_dir.mkdir(parents=True, exist_ok=True)
    try:
        yield temp_dir
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def app_env(workspace_tmp_dir, monkeypatch):
    uploads_dir = workspace_tmp_dir / "uploads"
    uploads_dir.mkdir()

    test_db_path = workspace_tmp_dir / "test.db"
    engine = create_engine(
        f"sqlite:///{test_db_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    models.Base.metadata.create_all(bind=engine)

    monkeypatch.setattr(config, "UPLOAD_DIR", str(uploads_dir))

    app = FastAPI()
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
    app.mount("/data", StaticFiles(directory=str(REMEMORY_ROOT / "data")), name="data")
    app.include_router(projects.router)
    app.include_router(interviews.router)
    app.include_router(orders.router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[database.get_db] = override_get_db

    try:
        yield {
            "app": app,
            "SessionLocal": TestingSessionLocal,
            "uploads_dir": uploads_dir,
        }
    finally:
        app.dependency_overrides.clear()
        models.Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(app_env):
    with TestClient(app_env["app"]) as test_client:
        yield test_client


@pytest.fixture
def other_client(app_env):
    with TestClient(app_env["app"]) as test_client:
        yield test_client


@pytest.fixture
def db_session(app_env):
    db = app_env["SessionLocal"]()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def sample_image_bytes():
    try:
        from PIL import Image
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("Pillow is required for upload tests") from exc

    image = Image.new("RGB", (16, 16), color=(230, 180, 160))
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def fake_bookprint(monkeypatch):
    state = {
        "create_book_calls": [],
        "finalize_calls": [],
        "estimate_calls": [],
        "create_order_calls": [],
        "cancel_order_calls": [],
        "get_order_calls": [],
        "credit_balance": 401000,
        "next_book_idx": 1,
        "build_calls": [],
    }

    def fake_create_book(title):
        book_uid = f"bk_test_{state['next_book_idx']}"
        state["next_book_idx"] += 1
        state["create_book_calls"].append({"title": title, "book_uid": book_uid})
        return book_uid

    def fake_build_book(db, project):
        state["build_calls"].append({"project_id": project.id, "book_uid": project.book_uid})
        project.status = "preview_ready"
        db.commit()

    def fake_finalize_book(book_uid):
        state["finalize_calls"].append(book_uid)
        return {"pageCount": 26}

    def fake_get_estimate(book_uid, quantity=1):
        state["estimate_calls"].append({"book_uid": book_uid, "quantity": quantity})
        return {
            "pageCount": 26,
            "productAmount": 20300 * quantity,
            "shippingFee": 3000,
            "totalAmount": 23300 * quantity,
            "paidCreditAmount": 25630 * quantity,
        }

    def fake_create_order(book_uid, quantity, shipping):
        order_uid = f"ord_test_{len(state['create_order_calls']) + 1}"
        state["create_order_calls"].append(
            {
                "book_uid": book_uid,
                "quantity": quantity,
                "shipping": shipping,
                "order_uid": order_uid,
            }
        )
        return {"orderUid": order_uid, "paidCreditAmount": 25630 * quantity}

    def fake_cancel_order(order_uid, reason):
        state["cancel_order_calls"].append({"order_uid": order_uid, "reason": reason})
        return {"ok": True}

    def fake_get_credit_balance():
        return state["credit_balance"]

    def fake_get_order(order_uid):
        state["get_order_calls"].append(order_uid)
        return {
            "orderUid": order_uid,
            "orderStatus": 20,
            "orderStatusDisplay": "PAID",
            "paidCreditAmount": 25630,
            "totalAmount": 23300,
            "totalProductAmount": 20300,
            "totalShippingFee": 3000,
            "trackingCarrier": None,
            "trackingNumber": None,
            "orderedAt": "2026-04-05T12:00:00",
        }

    def fake_sandbox_charge(amount):
        state["credit_balance"] += amount
        return {"amount": amount, "balance": state["credit_balance"]}

    monkeypatch.setattr(projects.bookprint, "create_book", fake_create_book)
    monkeypatch.setattr(interviews, "_resize_image", lambda data, max_bytes=config.MAX_PHOTO_SIZE: data)
    monkeypatch.setattr(interviews, "_PIL_AVAILABLE", False)
    monkeypatch.setattr(orders.bookprint, "finalize_book", fake_finalize_book)
    monkeypatch.setattr(orders.bookprint, "get_estimate", fake_get_estimate)
    monkeypatch.setattr(orders.bookprint, "create_order", fake_create_order)
    monkeypatch.setattr(orders.bookprint, "cancel_order", fake_cancel_order)
    monkeypatch.setattr(orders.bookprint, "get_credit_balance", fake_get_credit_balance)
    monkeypatch.setattr(orders.bookprint, "get_order", fake_get_order)
    monkeypatch.setattr(orders.bookprint, "sandbox_charge", fake_sandbox_charge)

    import services.book_builder as book_builder  # noqa: E402

    monkeypatch.setattr(book_builder, "build_book", fake_build_book)
    monkeypatch.setattr(book_builder, "_ensure_default_cover", lambda: str(REPO_ROOT / "frontend" / "public" / "stardust.png"))
    monkeypatch.setattr(book_builder, "bookprint", projects.bookprint)

    return state
