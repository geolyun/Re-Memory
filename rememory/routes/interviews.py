"""인터뷰 답변/사진 저장 + 책 빌드 API"""

import io
import logging
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

import config
import models
from database import get_db
from routes.projects import get_or_create_user

log = logging.getLogger(__name__)

try:
    from PIL import Image
    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False

router = APIRouter(prefix="/api")


def _resize_image(data: bytes, max_bytes: int = config.MAX_PHOTO_SIZE) -> bytes:
    """Pillow로 이미지 리사이즈 (2MB 이하로)"""
    if not _PIL_AVAILABLE:
        return data
    img = Image.open(io.BytesIO(data))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    quality = 85
    while True:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        result = buf.getvalue()
        if len(result) <= max_bytes or quality <= 40:
            return result
        quality -= 10
        w, h = img.size
        img = img.resize((int(w * 0.9), int(h * 0.9)), Image.LANCZOS)


def _get_owned_project(project_id: int, request: Request, db: Session) -> models.Project:
    """소유자 검증된 프로젝트 반환. 없거나 권한 없으면 403"""
    user = get_or_create_user(request, db)
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return project


# ── 답변 저장 ──────────────────────────────────────────────────────────────

def save_answer(
    project_id: int,
    qna_id: int,
    request: Request,
    answer: str = Form(""),
    skipped: bool = Form(False),
    time_period: str = Form(""),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, request, db)

    # finalized/ordered 상태에서는 수정 불가
    if project.status in ("finalized", "ordered"):
        raise HTTPException(status_code=400, detail="확정된 책은 수정할 수 없습니다.")

    qna = db.query(models.QnA).filter(models.QnA.id == qna_id).first()
    if not qna or qna.chapter.project_id != project_id:
        raise HTTPException(status_code=404, detail="QnA를 찾을 수 없습니다.")

    qna.answer_text = answer.strip() or None
    qna.skipped = skipped
    qna.time_period = time_period.strip() or None
    if answer.strip():
        qna.skipped = False
    db.commit()
    return JSONResponse({"ok": True})

# FastAPI는 def로 정의된 라우터를 자동으로 스레드풀에서 실행 → 이벤트 루프 블로킹 없음
router.add_api_route(
    "/projects/{project_id}/qna/{qna_id}",
    save_answer,
    methods=["POST"],
)


# ── 사진 업로드 ──────────────────────────────────────────────────────────

async def upload_photo(
    project_id: int,
    qna_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # await file.read()를 사용하므로 async def 유지
    project = _get_owned_project(project_id, request, db)
    if project.status in ("finalized", "ordered"):
        raise HTTPException(status_code=400, detail="확정된 책은 수정할 수 없습니다.")

    qna = db.query(models.QnA).filter(models.QnA.id == qna_id).first()
    if not qna or qna.chapter.project_id != project_id:
        raise HTTPException(status_code=404, detail="QnA를 찾을 수 없습니다.")

    if len(qna.photos) >= 5:
        raise HTTPException(status_code=400, detail="사진은 최대 5장까지 업로드할 수 있습니다.")

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일이 너무 큽니다. (최대 10MB)")

    processed = _resize_image(data)

    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    local_path = os.path.join(config.UPLOAD_DIR, filename)
    with open(local_path, "wb") as f:
        f.write(processed)

    photo = models.Photo(
        qna_id=qna_id,
        project_id=project_id,
        image_url=f"/uploads/{filename}",
        local_path=local_path,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return JSONResponse({"ok": True, "photo": {"id": photo.id, "url": photo.image_url}})

router.add_api_route(
    "/projects/{project_id}/qna/{qna_id}/photos",
    upload_photo,
    methods=["POST"],
)


# ── 사진 삭제 ──────────────────────────────────────────────────────────────

def delete_photo(
    project_id: int,
    photo_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, request, db)
    if project.status in ("finalized", "ordered"):
        raise HTTPException(status_code=400, detail="확정된 책은 수정할 수 없습니다.")

    photo = db.query(models.Photo).filter(
        models.Photo.id == photo_id,
        models.Photo.project_id == project_id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")

    if photo.local_path and os.path.exists(photo.local_path):
        os.remove(photo.local_path)

    db.delete(photo)
    db.commit()
    return JSONResponse({"ok": True})

router.add_api_route(
    "/projects/{project_id}/photos/{photo_id}",
    delete_photo,
    methods=["DELETE"],
)


# ── 표지 사진 업로드 ──────────────────────────────────────────────────────

async def upload_cover_photo(
    project_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, request, db)
    if project.status in ("finalized", "ordered"):
        raise HTTPException(status_code=400, detail="확정된 책은 수정할 수 없습니다.")

    data = await file.read()
    processed = _resize_image(data)

    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    filename = f"cover_{uuid.uuid4().hex}.jpg"
    local_path = os.path.join(config.UPLOAD_DIR, filename)
    with open(local_path, "wb") as f:
        f.write(processed)

    old = db.query(models.Photo).filter(
        models.Photo.project_id == project_id,
        models.Photo.is_cover == True,
        models.Photo.qna_id == None,
    ).first()
    if old:
        if old.local_path and os.path.exists(old.local_path):
            os.remove(old.local_path)
        db.delete(old)

    image_url = f"/uploads/{filename}"
    photo = models.Photo(
        project_id=project_id,
        image_url=image_url,
        local_path=local_path,
        is_cover=True,
    )
    db.add(photo)
    project.cover_image_url = image_url
    db.commit()
    db.refresh(photo)

    return JSONResponse({"ok": True, "url": image_url})

router.add_api_route(
    "/projects/{project_id}/cover-photo",
    upload_cover_photo,
    methods=["POST"],
)


# ── 책 빌드 ────────────────────────────────────────────────────────────────

def build_book(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    책 빌드: 사진 업로드 + 내지 삽입 + 표지 생성.
    동기 HTTP 호출(requests 라이브러리)이므로 def로 정의하여
    FastAPI가 스레드풀에서 실행 — 이벤트 루프 블로킹 방지.
    """
    from services.book_builder import build_book as _build

    project = _get_owned_project(project_id, request, db)
    if not project.book_uid:
        # 시드 데이터 등 book_uid 없는 프로젝트: 자동 생성
        try:
            from services import bookprint as bp
            project.book_uid = bp.create_book(project.title)
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"BookPrint API 오류: {e}")
    if project.status not in ("writing", "preview_ready"):
        raise HTTPException(status_code=400, detail=f"빌드할 수 없는 상태입니다: {project.status}")

    try:
        _build(db, project)
    except Exception as e:
        from bookprintapi import ApiError
        if isinstance(e, ApiError):
            log.error("[build] API 오류 status=%s message=%s details=%s",
                      e.status_code, e.message, e.details)
            detail = f"책 빌드 오류: [{e.status_code}] {e.message}"
            if e.details:
                detail += f" — {e.details}"
        else:
            log.error("[build] 오류: %s", e)
            detail = f"책 빌드 오류: {e}"
        project.status = "writing"
        db.commit()
        raise HTTPException(status_code=502, detail=detail)

    return JSONResponse({"ok": True, "project_id": project_id})

router.add_api_route(
    "/projects/{project_id}/build",
    build_book,
    methods=["POST"],
)
