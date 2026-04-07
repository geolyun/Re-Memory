"""Project CRUD, detail, demo access, and shared-writing routes."""

import io
import json
import os
import random
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import config
import models
from database import get_db
from services import bookprint
from services.qna_merge import merged_answer_text, merged_time_period

router = APIRouter(prefix="/api")

QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "questions.json")
DEMO_SESSION_ID = "MEMORYBOOK_DEMO_v1"

try:
    from PIL import Image

    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False


def get_or_create_user(request: Request, db: Session) -> models.User:
    session_id = request.cookies.get("session_id")
    if not session_id:
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
    if templates:
        template_data = templates.get(template) or templates.get("parents_memoir")
        return template_data["chapters"]
    return data["chapters"]


def _init_chapters(
    db: Session,
    project: models.Project,
    template: str = "parents_memoir",
    question_count: int = 10,
) -> None:
    chapters_data = _load_questions(template)
    chapter_count = len(chapters_data)
    base = question_count // chapter_count
    extra = question_count % chapter_count
    counts = [base + (1 if i < extra else 0) for i in range(chapter_count)]
    random.shuffle(counts)

    for chapter_data, qna_count in zip(chapters_data, counts):
        if qna_count == 0:
            continue

        chapter = models.Chapter(
            project_id=project.id,
            title=chapter_data["title"],
            order_index=chapter_data["order_index"],
        )
        db.add(chapter)
        db.flush()

        selected_questions = random.sample(chapter_data["questions"], min(qna_count, len(chapter_data["questions"])))
        for idx, question in enumerate(selected_questions, start=1):
            db.add(
                models.QnA(
                    chapter_id=chapter.id,
                    question_text=question["text"],
                    hint_text=question.get("hint"),
                    placeholder_text=question.get("placeholder"),
                    order_index=idx,
                )
            )

    db.commit()


def _resize_image(data: bytes, max_bytes: int = config.MAX_PHOTO_SIZE) -> bytes:
    if not _PIL_AVAILABLE:
        return data

    image = Image.open(io.BytesIO(data))
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    quality = 85
    while True:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality)
        result = buffer.getvalue()
        if len(result) <= max_bytes or quality <= 40:
            return result
        quality -= 10
        width, height = image.size
        image = image.resize((int(width * 0.9), int(height * 0.9)), Image.LANCZOS)


def _project_dict(project: models.Project, is_demo: bool = False) -> dict:
    return {
        "id": project.id,
        "title": project.title,
        "subtitle": project.subtitle,
        "subject_name": project.subject_name,
        "relationship_type": project.relationship_type,
        "status": project.status,
        "cover_image_url": project.cover_image_url,
        "updated_at": project.updated_at.isoformat(),
        "is_demo": is_demo,
        "read_only": is_demo,
    }


def _find_demo_project(project_id: int, db: Session) -> models.Project | None:
    demo_user = db.query(models.User).filter(models.User.session_id == DEMO_SESSION_ID).first()
    if not demo_user:
        return None
    return db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == demo_user.id,
    ).first()


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

    try:
        book_uid = bookprint.create_book(title)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"BookPrint API 오류: {exc}") from exc

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
            db.add(
                models.Photo(
                    project_id=project.id,
                    image_url=image_url,
                    local_path=local_path,
                    is_cover=True,
                )
            )
            project.cover_image_url = image_url
            db.commit()

    _init_chapters(db, project, template=template, question_count=max(5, min(15, question_count)))

    response = JSONResponse({"ok": True, "project_id": project.id})
    response.set_cookie("session_id", user.session_id, max_age=60 * 60 * 24 * 365, httponly=True)
    return response


@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_or_create_user(request, db)
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    if project.book_uid and project.status in ("draft", "writing"):
        try:
            bookprint.get_client().books.delete(project.book_uid)
        except Exception:
            pass

    upload_dir = os.path.realpath(config.UPLOAD_DIR)
    for photo in project.photos:
        if photo.local_path and os.path.exists(photo.local_path):
            if os.path.realpath(photo.local_path).startswith(upload_dir):
                os.remove(photo.local_path)

    db.delete(project)
    db.commit()
    return JSONResponse({"ok": True})


@router.get("/projects")
def get_projects(request: Request, db: Session = Depends(get_db)):
    user = get_or_create_user(request, db)
    projects = (
        db.query(models.Project)
        .filter(models.Project.user_id == user.id)
        .order_by(models.Project.updated_at.desc())
        .all()
    )
    result = [_project_dict(project) for project in projects]

    if not result:
        demo_user = db.query(models.User).filter(models.User.session_id == DEMO_SESSION_ID).first()
        if demo_user:
            demo_projects = (
                db.query(models.Project)
                .filter(models.Project.user_id == demo_user.id)
                .order_by(models.Project.updated_at.desc())
                .all()
            )
            result = [_project_dict(project, is_demo=True) for project in demo_projects]

    return JSONResponse(result)


@router.get("/projects/{project_id}")
def get_project_detail(project_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_or_create_user(request, db)
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user.id,
    ).first()

    is_demo = False
    if not project:
        project = _find_demo_project(project_id, db)
        is_demo = bool(project)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    chapters = (
        db.query(models.Chapter)
        .filter(models.Chapter.project_id == project.id)
        .order_by(models.Chapter.order_index)
        .all()
    )

    qnas = []
    for chapter in chapters:
        for qna in chapter.qnas:
            qnas.append(
                {
                    "id": qna.id,
                    "chapter_title": chapter.title,
                    "chapter_order": chapter.order_index,
                    "question": qna.question_text,
                    "hint": qna.hint_text,
                    "placeholder": qna.placeholder_text,
                    "answer": merged_answer_text(qna),
                    "time_period": merged_time_period(qna),
                    "skipped": qna.skipped,
                    "photos": [{"id": photo.id, "url": photo.image_url} for photo in qna.photos],
                }
            )

    cover_photo = db.query(models.Photo).filter(
        models.Photo.project_id == project.id,
        models.Photo.is_cover == True,
        models.Photo.qna_id == None,
    ).first()

    return JSONResponse(
        {
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
                "is_demo": is_demo,
                "read_only": is_demo,
            },
            "chapters": [
                {
                    "id": chapter.id,
                    "title": chapter.title,
                    "order_index": chapter.order_index,
                    "use_ganji": chapter.use_ganji,
                    "ganji_tpl_uid": chapter.ganji_tpl_uid,
                }
                for chapter in chapters
            ],
            "qnas": qnas,
            "cover_photo": {"url": cover_photo.image_url} if cover_photo else None,
        }
    )


@router.get("/ganji-templates")
def get_ganji_templates():
    return JSONResponse(config.GANJI_TEMPLATES)


@router.patch("/projects/{project_id}/chapters/{chapter_id}/ganji")
def update_chapter_ganji(
    project_id: int,
    chapter_id: int,
    request: Request,
    use_ganji: bool = Form(True),
    ganji_tpl_uid: str = Form(""),
    db: Session = Depends(get_db),
):
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


@router.post("/projects/{project_id}/share")
def create_share_token(project_id: int, request: Request, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    user = get_or_create_user(request, db)
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    if not project.share_token:
        project.share_token = uuid.uuid4().hex
        db.commit()
    return JSONResponse({"share_token": project.share_token})


@router.delete("/projects/{project_id}/share")
def revoke_share_token(project_id: int, request: Request, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    user = get_or_create_user(request, db)
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    project.share_token = None
    db.commit()
    return JSONResponse({"ok": True})


@router.get("/share/{token}")
def get_shared_project(token: str, db: Session = Depends(get_db)):
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
    for chapter in chapters:
        for qna in chapter.qnas:
            qnas.append(
                {
                    "id": qna.id,
                    "chapter_title": chapter.title,
                    "chapter_order": chapter.order_index,
                    "question": qna.question_text,
                    "hint": qna.hint_text,
                    "placeholder": qna.placeholder_text,
                    "answer": merged_answer_text(qna),
                    "time_period": merged_time_period(qna),
                    "skipped": qna.skipped,
                }
            )

    return JSONResponse(
        {
            "project": {
                "id": project.id,
                "title": project.title,
                "subject_name": project.subject_name,
                "relationship_type": project.relationship_type,
                "cover_image_url": project.cover_image_url,
            },
            "qnas": qnas,
        }
    )


@router.post("/share/{token}/qna/{qna_id}")
def save_shared_answer(
    token: str,
    qna_id: int,
    answer: str = Form(""),
    time_period: str = Form(""),
    contributor_name: str = Form(""),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(models.Project.share_token == token).first()
    if not project:
        raise HTTPException(status_code=404, detail="유효하지 않은 공유 링크입니다.")
    if project.status in ("finalized", "ordered"):
        raise HTTPException(status_code=400, detail="확정된 책은 수정할 수 없습니다.")

    qna = db.query(models.QnA).filter(models.QnA.id == qna_id).first()
    if not qna or qna.chapter.project_id != project.id:
        raise HTTPException(status_code=404, detail="질문을 찾을 수 없습니다.")

    if answer.strip():
        db.add(
            models.Contribution(
                qna_id=qna.id,
                contributor_name=contributor_name.strip() or None,
                answer_text=answer.strip(),
                time_period=time_period.strip() or None,
            )
        )
        db.commit()

    return JSONResponse({"ok": True})
