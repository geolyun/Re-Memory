"""Pipeline that builds a BookPrint book from DB data."""

import os
from datetime import datetime

from sqlalchemy.orm import Session

import config
import models
from services import bookprint
from services.qna_merge import merged_answer_text

_DEFAULT_COVER_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "default_cover.jpg")


def _ensure_default_cover() -> str:
    """Create a fallback cover locally when no uploaded image exists."""
    if os.path.exists(_DEFAULT_COVER_PATH):
        return _DEFAULT_COVER_PATH
    try:
        from PIL import Image, ImageDraw, ImageFont

        img = Image.new("RGB", (800, 800), color=(245, 240, 235))
        draw = ImageDraw.Draw(img)
        for i in range(800):
            alpha = int(30 * (i / 800))
            draw.line([(0, i), (800, i)], fill=(200 - alpha, 185 - alpha, 170 - alpha))
        try:
            font = ImageFont.truetype("arial.ttf", 48)
            small_font = ImageFont.truetype("arial.ttf", 24)
        except Exception:
            font = ImageFont.load_default()
            small_font = font
        draw.text((400, 360), "📖", font=font, anchor="mm", fill=(120, 100, 80))
        draw.text((400, 440), "Re:Memory", font=font, anchor="mm", fill=(100, 80, 60))
        draw.text((400, 500), "기억을 잇다", font=small_font, anchor="mm", fill=(150, 130, 110))
        os.makedirs(os.path.dirname(_DEFAULT_COVER_PATH), exist_ok=True)
        img.save(_DEFAULT_COVER_PATH, "JPEG", quality=85)
    except Exception as exc:
        print(f"[build] 기본 표지 생성 실패: {exc}", flush=True)
    return _DEFAULT_COVER_PATH


def _refresh_draft_book(db: Session, project: models.Project) -> str:
    """Create a fresh draft book and detach old uploaded asset references."""
    try:
        new_book_uid = bookprint.create_book(project.title)
    except Exception as exc:
        raise RuntimeError(f"BookPrint 책 초기화 실패: {exc}") from exc

    project.book_uid = new_book_uid
    project.cover_api_filename = None
    for photo in project.photos:
        photo.api_file_name = None
    db.commit()
    return new_book_uid


def build_book(db: Session, project: models.Project) -> None:
    """
    Send the project interview data to BookPrint API.

    Pipeline:
      1. Prepare a fresh draft book when rebuilding
      2. Upload cover photo
      3. Create cover
      4. Insert chapter divider and QnA pages
      5. Pad blank pages to minimum page count
      6. Insert publish page
    """
    book_uid = project.book_uid
    if not book_uid:
        raise ValueError("book_uid is missing.")

    if project.status in ("preview_ready", "building"):
        book_uid = _refresh_draft_book(db, project)

    project.status = "building"
    db.commit()

    cover_photo = (
        db.query(models.Photo)
        .filter(
            models.Photo.project_id == project.id,
            models.Photo.is_cover == True,
            models.Photo.qna_id == None,
        )
        .first()
    )

    cover_local_path = None
    if cover_photo and cover_photo.local_path and os.path.exists(cover_photo.local_path):
        cover_local_path = cover_photo.local_path
    else:
        first_qna_photo = (
            db.query(models.Photo)
            .filter(
                models.Photo.project_id == project.id,
                models.Photo.is_cover == False,
                models.Photo.qna_id != None,
            )
            .first()
        )
        if first_qna_photo and first_qna_photo.local_path and os.path.exists(first_qna_photo.local_path):
            cover_local_path = first_qna_photo.local_path
        else:
            cover_local_path = _ensure_default_cover()

    print(f"[build] 표지 사진 업로드: {cover_local_path}", flush=True)
    cover_photo_name = bookprint.upload_photo(book_uid, cover_local_path)
    if cover_photo:
        cover_photo.api_file_name = cover_photo_name
    project.cover_api_filename = cover_photo_name
    db.commit()

    print(f"[build] 표지 생성: {project.title}", flush=True)
    bookprint.create_cover(
        book_uid,
        title=project.title,
        photo_file_name=cover_photo_name,
    )

    chapters = (
        db.query(models.Chapter)
        .filter(models.Chapter.project_id == project.id)
        .order_by(models.Chapter.order_index)
        .all()
    )

    content_pages = 0
    chapter_date = project.created_at or datetime.now()

    for chapter_idx, chapter in enumerate(chapters, start=1):
        active_qnas = [qna for qna in chapter.qnas if not qna.skipped and merged_answer_text(qna)]
        if not active_qnas:
            continue

        if chapter.use_ganji:
            print(f"[build] 간지 삽입: {chapter.title}", flush=True)
            bookprint.insert_ganji(
                book_uid,
                chapter_num=chapter_idx,
                chapter_date=chapter_date,
                chapter_title=chapter.title,
                tpl_uid=chapter.ganji_tpl_uid or None,
            )
            content_pages += 2
        else:
            print(f"[build] 간지 생략: {chapter.title}", flush=True)

        for qna in active_qnas:
            merged_answer = merged_answer_text(qna)
            if not merged_answer:
                continue

            photo_file_name = None
            if qna.photos:
                first_photo = qna.photos[0]
                if first_photo.local_path and not first_photo.api_file_name:
                    first_photo.api_file_name = bookprint.upload_photo(book_uid, first_photo.local_path)
                    db.commit()
                photo_file_name = first_photo.api_file_name

            print(f"[build] QnA 삽입: {qna.question_text[:30]}...", flush=True)
            if photo_file_name:
                bookprint.insert_qna_with_photo(
                    book_uid,
                    question=qna.question_text,
                    answer=merged_answer,
                    photo_file_name=photo_file_name,
                )
            else:
                bookprint.insert_qna(
                    book_uid,
                    question=qna.question_text,
                    answer=merged_answer,
                )
            content_pages += 1

    api_min_pages = 20
    padding_needed = max(0, max(config.MIN_PAGES, api_min_pages) - content_pages - 1)
    if padding_needed:
        print(f"[build] 빈 내지 {padding_needed}p 추가", flush=True)
    for _ in range(padding_needed):
        bookprint.insert_blank(book_uid)

    today_str = datetime.now().strftime("%Y.%m.%d")
    print(f"[build] 발행면 삽입: {today_str}", flush=True)
    bookprint.insert_publish(
        book_uid,
        title=project.title,
        author=project.subject_name,
        publish_date=today_str,
        photo_file_name=project.cover_api_filename or None,
    )

    project.status = "preview_ready"
    db.commit()
    print("[build] 완료!", flush=True)
