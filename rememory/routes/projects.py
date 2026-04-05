"""프로젝트 CRUD API"""

import io
import json
import os
import random
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

import config
import models
from database import get_db
from services import bookprint

router = APIRouter(prefix="/api")

QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "questions.json")

try:
    from PIL import Image
    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False


DEMO_SESSION_ID = "MEMORYBOOK_DEMO_v1"


def get_or_create_user(request: Request, db: Session) -> models.User:
    """쿠키 기반 익명 세션 사용자 반환.
    쿠키가 있으면 해당 세션 사용자를 조회/생성한다.
    쿠키가 없는 신규 방문자는 고유한 세션 ID를 자동 발급받는다.
    (DEMO_SESSION_ID는 seed 데이터 전용이며 일반 방문자와 공유하지 않는다.)
    """
    session_id = request.cookies.get("session_id")
    if not session_id:
        # 신규 방문자 → 고유 세션 발급
        session_id = f"anon_{uuid.uuid4().hex}"

    user = db.query(models.User).filter(models.User.session_id == session_id).first()
    if not user:
        user = models.User(session_id=session_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _load_questions(template: str = "parents_memoir") -> list[dict]:
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    templates = data.get("templates", {})
    # 새 멀티-템플릿 형식
    if templates:
        tpl = templates.get(template) or templates.get("parents_memoir")
        return tpl["chapters"]
    # 구형 단일-챕터 형식 폴백
    return data["chapters"]


def _init_chapters(db: Session, project: models.Project, template: str = "parents_memoir", question_count: int = 10):
    """질문 템플릿으로 챕터/QnA 초기화.
    question_count만큼의 질문을 챕터에 고르게 분배하고, 각 챕터 내에서는 무작위로 선정한다.
    """
    chapters_data = _load_questions(template)
    n_chapters = len(chapters_data)

    # 각 챕터에 배분할 질문 수 계산
    base = question_count // n_chapters
    extra = question_count % n_chapters
    counts = [base + (1 if i < extra else 0) for i in range(n_chapters)]
    random.shuffle(counts)  # 어느 챕터가 더 많은 질문을 받을지 무작위화

    for ch_data, n_q in zip(chapters_data, counts):
        if n_q == 0:
            continue  # 이 챕터는 건너뜀
        chapter = models.Chapter(
            project_id=project.id,
            title=ch_data["title"],
            order_index=ch_data["order_index"],
        )
        db.add(chapter)
        db.flush()
        pool = ch_data["questions"]
        selected = random.sample(pool, min(n_q, len(pool)))
        for idx, q_data in enumerate(selected, start=1):
            qna = models.QnA(
                chapter_id=chapter.id,
                question_text=q_data["text"],
                hint_text=q_data.get("hint"),
                placeholder_text=q_data.get("placeholder"),
                order_index=idx,
            )
            db.add(qna)
    db.commit()


def _resize_image(data: bytes, max_bytes: int = config.MAX_PHOTO_SIZE) -> bytes:
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


@router.post("/projects")
async def create_project(
    request: Request,
    subject_name: str = Form(...),
    relationship_type: str = Form(...),
    title: str = Form(...),
    subtitle: str = Form(""),
    template: str = Form("parents_memoir"),
    question_count: int = Form(10),
    cover_photo: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(request, db)

    # BookPrint API: 책 생성
    try:
        book_uid = bookprint.create_book(title)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"BookPrint API 오류: {e}")

    project = models.Project(
        user_id=user.id,
        title=title,
        subtitle=subtitle or None,
        subject_name=subject_name,
        relationship_type=relationship_type,
        book_uid=book_uid,
        status="writing",
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # 대표 사진 저장
    if cover_photo and cover_photo.filename:
        data = await cover_photo.read()
        if data:
            processed = _resize_image(data)
            os.makedirs(config.UPLOAD_DIR, exist_ok=True)
            filename = f"cover_{uuid.uuid4().hex}.jpg"
            local_path = os.path.join(config.UPLOAD_DIR, filename)
            with open(local_path, "wb") as f:
                f.write(processed)

            image_url = f"/uploads/{filename}"
            photo = models.Photo(
                project_id=project.id,
                image_url=image_url,
                local_path=local_path,
                is_cover=True,
            )
            db.add(photo)
            project.cover_image_url = image_url
            db.commit()

    _init_chapters(db, project, template=template, question_count=max(5, min(15, question_count)))

    resp = JSONResponse({"ok": True, "project_id": project.id})
    resp.set_cookie("session_id", user.session_id, max_age=60 * 60 * 24 * 365, httponly=True)
    return resp


@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_or_create_user(request, db)
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    # BookPrint API: draft 상태 책 삭제 시도
    if project.book_uid and project.status in ("draft", "writing"):
        try:
            client = bookprint.get_client()
            client.books.delete(project.book_uid)
        except Exception:
            pass

    # 로컬 파일 삭제
    for photo in project.photos:
        if photo.local_path and os.path.exists(photo.local_path):
            os.remove(photo.local_path)

    db.delete(project)
    db.commit()
    return JSONResponse({"ok": True})


def _project_dict(p: models.Project, is_demo: bool = False) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "subtitle": p.subtitle,
        "subject_name": p.subject_name,
        "relationship_type": p.relationship_type,
        "status": p.status,
        "cover_image_url": p.cover_image_url,
        "updated_at": p.updated_at.isoformat(),
        "is_demo": is_demo,
    }


@router.get("/projects")
def get_projects(request: Request, db: Session = Depends(get_db)):
    user = get_or_create_user(request, db)
    projects = (
        db.query(models.Project)
        .filter(models.Project.user_id == user.id)
        .order_by(models.Project.updated_at.desc())
        .all()
    )
    result = [_project_dict(p) for p in projects]

    # 본인 프로젝트가 없으면 데모 프로젝트를 예시로 함께 반환
    if not result:
        demo_user = db.query(models.User).filter(models.User.session_id == DEMO_SESSION_ID).first()
        if demo_user:
            demo_projects = (
                db.query(models.Project)
                .filter(models.Project.user_id == demo_user.id)
                .order_by(models.Project.updated_at.desc())
                .all()
            )
            result = [_project_dict(p, is_demo=True) for p in demo_projects]

    return JSONResponse(result)


@router.get("/projects/{project_id}")
def get_project_detail(project_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_or_create_user(request, db)
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    chapters = (
        db.query(models.Chapter)
        .filter(models.Chapter.project_id == project_id)
        .order_by(models.Chapter.order_index)
        .all()
    )
    qnas = []
    for c in chapters:
        for q in c.qnas:
            qnas.append({
                "id": q.id,
                "chapter_title": c.title,
                "chapter_order": c.order_index,
                "question": q.question_text,
                "hint": q.hint_text,
                "placeholder": q.placeholder_text,
                "answer": q.answer_text or "",
                "time_period": q.time_period or "",
                "skipped": q.skipped,
                "photos": [{"id": p.id, "url": p.image_url} for p in q.photos],
            })

    cover_photo = db.query(models.Photo).filter(
        models.Photo.project_id == project_id,
        models.Photo.is_cover == True,
        models.Photo.qna_id == None,
    ).first()

    return JSONResponse({
        "project": {
            "id": project.id,
            "title": project.title,
            "subtitle": project.subtitle,
            "subject_name": project.subject_name,
            "relationship_type": project.relationship_type,
            "status": project.status,
            "page_count": project.page_count,
            "order_uid": project.order_uid,
            "cover_image_url": project.cover_image_url,
            "share_token": project.share_token,
        },
        "chapters": [{"id": c.id, "title": c.title, "order_index": c.order_index,
                      "use_ganji": c.use_ganji, "ganji_tpl_uid": c.ganji_tpl_uid} for c in chapters],
        "qnas": qnas,
        "cover_photo": {"url": cover_photo.image_url} if cover_photo else None,
    })


# ── 간지 템플릿 목록 ────────────────────────────────────────────────

@router.get("/ganji-templates")
def get_ganji_templates():
    """사용 가능한 간지 템플릿 목록 반환."""
    return JSONResponse(config.GANJI_TEMPLATES)


# ── 챕터 간지 설정 업데이트 ─────────────────────────────────────────

@router.patch("/projects/{project_id}/chapters/{chapter_id}/ganji")
def update_chapter_ganji(
    project_id: int,
    chapter_id: int,
    request: Request,
    use_ganji: bool = Form(True),
    ganji_tpl_uid: str = Form(""),
    db: Session = Depends(get_db),
):
    """챕터별 간지 포함 여부 및 템플릿 설정."""
    user = get_or_create_user(request, db)
    chapter = (
        db.query(models.Chapter)
        .join(models.Project)
        .filter(
            models.Chapter.id == chapter_id,
            models.Project.id == project_id,
            models.Project.user_id == user.id,
        )
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="챕터를 찾을 수 없습니다.")

    chapter.use_ganji = use_ganji
    chapter.ganji_tpl_uid = ganji_tpl_uid.strip() or None
    db.commit()
    return JSONResponse({"ok": True})


# ── 공동 작성: 공유 토큰 생성 ───────────────────────────────────────

@router.post("/projects/{project_id}/share")
def create_share_token(project_id: int, request: Request, db: Session = Depends(get_db)):
    """공동 작성용 공유 토큰 생성 (이미 있으면 기존 토큰 반환)."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    # 소유자 검증
    user = get_or_create_user(request, db)
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    if not project.share_token:
        project.share_token = uuid.uuid4().hex
        db.commit()
    return JSONResponse({"share_token": project.share_token})


@router.delete("/projects/{project_id}/share")
def revoke_share_token(project_id: int, request: Request, db: Session = Depends(get_db)):
    """공유 링크 비활성화."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    user = get_or_create_user(request, db)
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    project.share_token = None
    db.commit()
    return JSONResponse({"ok": True})


# ── 공동 작성: 토큰으로 프로젝트 조회 ────────────────────────────────

@router.get("/share/{token}")
def get_shared_project(token: str, db: Session = Depends(get_db)):
    """공유 토큰으로 프로젝트 + 질문 목록 반환 (답변 없는 문항 포함)."""
    project = db.query(models.Project).filter(models.Project.share_token == token).first()
    if not project:
        raise HTTPException(status_code=404, detail="유효하지 않은 공유 링크입니다.")

    chapters = (
        db.query(models.Chapter)
        .filter(models.Chapter.project_id == project.id)
        .order_by(models.Chapter.order_index)
        .all()
    )
    qnas = []
    for c in chapters:
        for q in c.qnas:
            qnas.append({
                "id": q.id,
                "chapter_title": c.title,
                "chapter_order": c.order_index,
                "question": q.question_text,
                "hint": q.hint_text,
                "placeholder": q.placeholder_text,
                "answer": q.answer_text or "",
                "time_period": q.time_period or "",
                "skipped": q.skipped,
            })

    return JSONResponse({
        "project": {
            "id": project.id,
            "title": project.title,
            "subject_name": project.subject_name,
            "relationship_type": project.relationship_type,
            "cover_image_url": project.cover_image_url,
        },
        "qnas": qnas,
    })


@router.post("/share/{token}/qna/{qna_id}")
def save_shared_answer(
    token: str,
    qna_id: int,
    answer: str = Form(""),
    time_period: str = Form(""),
    contributor_name: str = Form(""),
    db: Session = Depends(get_db),
):
    """공유 링크 참여자가 답변을 저장한다."""
    project = db.query(models.Project).filter(models.Project.share_token == token).first()
    if not project:
        raise HTTPException(status_code=404, detail="유효하지 않은 공유 링크입니다.")
    if project.status in ("finalized", "ordered"):
        raise HTTPException(status_code=400, detail="확정된 책은 수정할 수 없습니다.")

    qna = db.query(models.QnA).filter(models.QnA.id == qna_id).first()
    if not qna or qna.chapter.project_id != project.id:
        raise HTTPException(status_code=404, detail="질문을 찾을 수 없습니다.")

    if answer.strip():
        # 기여자 이름이 있으면 답변 앞에 표시
        text = answer.strip()
        if contributor_name.strip():
            text = f"[{contributor_name.strip()}] {text}"
        qna.answer_text = text
        qna.time_period = time_period.strip() or qna.time_period
        qna.skipped = False
        db.commit()

    return JSONResponse({"ok": True})
