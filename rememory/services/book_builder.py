"""Pipeline that builds a BookPrint book from DB data."""

from datetime import datetime

from sqlalchemy.orm import Session

import config
import models
from services import bookprint


def build_book(db: Session, project: models.Project) -> None:
    """
    Send the project interview data to BookPrint API.

    Pipeline:
      1. Clear existing contents if rebuilding
      2. Upload cover photo (if any)
      3. Create cover
      4. For each chapter: insert ganji + QnA pages
      5. Pad blank pages to meet minimum page count
      6. Insert publish page
    """
    book_uid = project.book_uid
    if not book_uid:
        raise ValueError("book_uid is missing.")

    if project.status in ("preview_ready", "building"):
        bookprint.clear_contents(book_uid)

    project.status = "building"
    db.commit()

    # 1. 표지 사진 업로드
    cover_photo_name = None
    cover_photo = (
        db.query(models.Photo)
        .filter(
            models.Photo.project_id == project.id,
            models.Photo.is_cover == True,
            models.Photo.qna_id == None,
        )
        .first()
    )
    if cover_photo and cover_photo.local_path:
        print(f"[build] 표지 사진 업로드: {cover_photo.local_path}", flush=True)
        cover_photo_name = bookprint.upload_photo(book_uid, cover_photo.local_path)
        cover_photo.api_file_name = cover_photo_name
        project.cover_api_filename = cover_photo_name
        db.commit()

    # 2. 표지 생성 (기존 표지 삭제 후 재생성)
    bookprint.delete_cover(book_uid)
    print(f"[build] 표지 생성: {project.title}", flush=True)
    bookprint.create_cover(
        book_uid,
        title=project.title,
        photo_file_name=cover_photo_name,
    )

    # 3. 챕터별 내지 삽입
    chapters = (
        db.query(models.Chapter)
        .filter(models.Chapter.project_id == project.id)
        .order_by(models.Chapter.order_index)
        .all()
    )

    content_pages = 0
    chapter_date = project.created_at or datetime.now()

    for chapter_idx, chapter in enumerate(chapters, start=1):
        active_qnas = [q for q in chapter.qnas if not q.skipped and q.answer_text]
        if not active_qnas:
            continue

        # 간지 (2페이지)
        print(f"[build] 간지 삽입: {chapter.title}", flush=True)
        bookprint.insert_ganji(book_uid, chapter_num=chapter_idx, chapter_date=chapter_date)
        content_pages += 2

        for qna in active_qnas:
            # QnA 첫 번째 사진 업로드 (템플릿이 지원하는 경우 활용)
            photo_file_name = None
            if qna.photos:
                first_photo = qna.photos[0]
                if first_photo.local_path and not first_photo.api_file_name:
                    fname = bookprint.upload_photo(book_uid, first_photo.local_path)
                    first_photo.api_file_name = fname
                    db.commit()
                photo_file_name = qna.photos[0].api_file_name

            print(f"[build] QnA 삽입: {qna.question_text[:30]}...", flush=True)
            bookprint.insert_qna(
                book_uid,
                question=qna.question_text,
                answer=qna.answer_text or "",
                photo_file_name=photo_file_name,
            )
            content_pages += 1

    # 4. 빈내지 패딩 (최소 페이지 - 발행면 1p 여유)
    padding_needed = max(0, config.MIN_PAGES - content_pages - 1)
    if padding_needed:
        print(f"[build] 빈내지 {padding_needed}장 추가", flush=True)
    for _ in range(padding_needed):
        bookprint.insert_blank(book_uid)

    # 5. 발행면 삽입
    today_str = datetime.now().strftime("%Y.%m.%d")
    print(f"[build] 발행면 삽입: {today_str}", flush=True)
    bookprint.insert_publish(
        book_uid,
        title=project.title,
        author=project.subject_name,
        publish_date=today_str,
    )

    project.status = "preview_ready"
    db.commit()
    print("[build] 완료!", flush=True)
