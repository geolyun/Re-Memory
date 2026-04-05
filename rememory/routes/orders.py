"""Finalize, order, and credit API routes."""

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from routes.projects import get_or_create_user
from services import bookprint

router = APIRouter(prefix="/api")


def _get_owned_project(project_id: int, request: Request, db: Session) -> models.Project:
    user = get_or_create_user(request, db)
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.user_id == user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return project


def finalize_book(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Finalize a preview-ready book."""
    project = _get_owned_project(project_id, request, db)
    if project.status != "preview_ready":
        raise HTTPException(status_code=400, detail="미리보기 완료 후 확정할 수 있습니다.")
    if not project.book_uid:
        raise HTTPException(status_code=400, detail="책이 아직 빌드되지 않았습니다. 미리보기 생성을 먼저 해주세요.")

    try:
        data = bookprint.finalize_book(project.book_uid)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"확정 오류: {e}")

    project.status = "finalized"
    project.page_count = data.get("pageCount")
    db.commit()

    return JSONResponse({"ok": True})


router.add_api_route("/projects/{project_id}/finalize", finalize_book, methods=["POST"])


def rebuild_book(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Clear generated content and move the project back to writing.

    book_uid is set to None so that the next build call creates a fresh
    BookPrint draft (handled by the build route's existing null-check).
    This avoids an extra API round-trip here and makes the endpoint reliable.
    """
    project = _get_owned_project(project_id, request, db)
    if project.status not in ("preview_ready", "building", "writing"):
        raise HTTPException(status_code=400, detail="수정할 수 없는 상태입니다.")

    project.book_uid = None
    for photo in project.photos:
        photo.api_file_name = None
    project.cover_api_filename = None
    project.status = "writing"
    db.commit()

    return JSONResponse({"ok": True})


router.add_api_route("/projects/{project_id}/rebuild", rebuild_book, methods=["POST"])


def create_order(
    project_id: int,
    request: Request,
    recipient_name: str = Form(...),
    recipient_phone: str = Form(...),
    postal_code: str = Form(...),
    address1: str = Form(...),
    address2: str = Form(""),
    shipping_memo: str = Form(""),
    quantity: int = Form(1),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, request, db)
    if project.status != "finalized":
        raise HTTPException(status_code=400, detail="확정된 책만 주문할 수 있습니다.")

    shipping: dict = {
        "recipientName": recipient_name,
        "recipientPhone": recipient_phone,
        "postalCode": postal_code,
        "address1": address1,
    }
    if address2:
        shipping["address2"] = address2
    if shipping_memo:
        shipping["memo"] = shipping_memo

    try:
        order_data = bookprint.create_order(project.book_uid, quantity, shipping)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"주문 오류: {e}")

    project.order_uid = order_data.get("orderUid", "")
    project.status = "ordered"
    db.commit()

    return JSONResponse({"ok": True, "order_uid": project.order_uid})


router.add_api_route("/projects/{project_id}/order", create_order, methods=["POST"])


def cancel_order(
    project_id: int,
    request: Request,
    cancel_reason: str = Form("사용자 요청"),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, request, db)
    if project.status != "ordered":
        raise HTTPException(status_code=400, detail="주문 완료 상태에서만 취소할 수 있습니다.")
    if not project.order_uid:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")

    try:
        bookprint.cancel_order(project.order_uid, cancel_reason)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"취소 오류: {e}")

    project.status = "finalized"
    project.order_uid = None
    db.commit()

    return JSONResponse({"ok": True})


router.add_api_route("/projects/{project_id}/order/cancel", cancel_order, methods=["POST"])


def get_estimate(
    project_id: int,
    request: Request,
    quantity: int = 1,
    db: Session = Depends(get_db),
):
    """Get normalized estimate data for the order page."""
    project = _get_owned_project(project_id, request, db)

    if not project.book_uid:
        raise HTTPException(status_code=404, detail="아직 빌드되지 않은 책입니다.")

    try:
        estimate = bookprint.get_estimate(project.book_uid, quantity=max(1, quantity))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    normalized = {
        "pageCount": estimate.get("pageCount"),
        "productsPrice": estimate.get("productAmount", estimate.get("totalProductAmount")),
        "deliveryFee": estimate.get("shippingFee", estimate.get("totalShippingFee")),
        "totalPrice": estimate.get("paidCreditAmount", estimate.get("totalAmount")),
        "raw": estimate,
    }
    return JSONResponse(normalized)


router.add_api_route("/projects/{project_id}/estimate", get_estimate, methods=["GET"])


@router.get("/credits/balance")
def get_balance():
    """Get current credit balance."""
    try:
        balance = bookprint.get_credit_balance()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return JSONResponse({"balance": balance})


def charge_credits(amount: int = Form(100000)):
    """Charge sandbox credits."""
    try:
        data = bookprint.sandbox_charge(amount)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return JSONResponse({"ok": True, "data": data})


router.add_api_route("/credits/charge", charge_credits, methods=["POST"])


@router.get("/projects/{project_id}/order-detail")
def get_order_detail(project_id: int, request: Request, db: Session = Depends(get_db)):
    project = _get_owned_project(project_id, request, db)
    order_data = {}
    balance = 0
    try:
        balance = bookprint.get_credit_balance()
    except Exception:
        pass
    if project.order_uid:
        try:
            raw_order = bookprint.get_order(project.order_uid)
            order_data = {
                "orderUid": raw_order.get("orderUid", project.order_uid),
                "status": raw_order.get("orderStatusDisplay") or raw_order.get("orderStatus"),
                "statusCode": raw_order.get("orderStatus"),
                "totalPrice": raw_order.get("paidCreditAmount", raw_order.get("totalAmount")),
                "productPrice": raw_order.get("totalProductAmount"),
                "deliveryFee": raw_order.get("totalShippingFee"),
                "trackingCarrier": raw_order.get("trackingCarrier"),
                "trackingNumber": raw_order.get("trackingNumber"),
                "orderedAt": raw_order.get("orderedAt"),
                "raw": raw_order,
            }
        except Exception:
            pass
    return JSONResponse({"order": order_data, "balance": balance})
