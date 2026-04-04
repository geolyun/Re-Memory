"""더미 데이터 로드 — 앱 최초 실행 시 샘플 프로젝트 삽입"""

import json
import os

import models

SEED_PATH = os.path.join(os.path.dirname(__file__), "data", "seed.json")
SAMPLE_PHOTOS_DIR = os.path.join(os.path.dirname(__file__), "data", "sample_photos")
DEMO_SESSION_ID = "MEMORYBOOK_DEMO_v1"

# 챕터별 대표 색상 (RGB)
_CHAPTER_COLORS = [
    (255, 200, 150),  # 어린 시절 — 따뜻한 오렌지
    (150, 200, 255),  # 학창 시절 — 하늘색
    (150, 230, 180),  # 첫 사회생활 — 연두
    (255, 180, 200),  # 사랑과 가족 — 핑크
    (200, 180, 255),  # 인생의 전환점 — 라벤더
    (255, 230, 150),  # 지금, 하고 싶은 말 — 노란
]

_CHAPTER_LABELS = [
    "Childhood",
    "School Days",
    "First Job",
    "Love & Family",
    "Turning Point",
    "Right Now",
]

_PHOTO_NAMES = [
    "childhood.jpg",
    "school.jpg",
    "first_job.jpg",
    "family.jpg",
    "turning_point.jpg",
    "now.jpg",
]


def _generate_sample_photos():
    """Pillow로 색상 블록 샘플 이미지 6장 생성"""
    os.makedirs(SAMPLE_PHOTOS_DIR, exist_ok=True)

    try:
        from PIL import Image, ImageDraw, ImageFont
        _has_pil = True
    except ImportError:
        _has_pil = False

    for i, filename in enumerate(_PHOTO_NAMES):
        path = os.path.join(SAMPLE_PHOTOS_DIR, filename)

        if _has_pil:
            img = Image.new("RGB", (800, 600), color=_CHAPTER_COLORS[i])
            draw = ImageDraw.Draw(img)

            label = _CHAPTER_LABELS[i]

            try:
                font = ImageFont.truetype("arial.ttf", 48)
            except Exception:
                font = ImageFont.load_default()

            bbox = draw.textbbox((0, 0), label, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            x = (800 - tw) // 2
            y = (600 - th) // 2
            draw.text((x, y), label, fill=(60, 60, 60), font=font)
            img.save(path, "JPEG", quality=85)
        else:
            # Pillow 없을 때 최소 JPEG 생성 (1×1 픽셀 회색)
            _minimal_jpeg = (
                b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
                b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
                b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
                b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1eC"
                b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
                b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
                b"\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
                b"\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04"
                b"\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa"
                b"\x07\"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br"
                b"\x82\t\n\x16\x17\x18\x19\x1a%&'()*456789:CDEFGHIJSTUVWXYZ"
                b"cdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94"
                b"\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa"
                b"\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7"
                b"\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3"
                b"\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8"
                b"\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xd3\xff\xd9"
            )
            with open(path, "wb") as f:
                f.write(_minimal_jpeg)


def _create_project_from_data(db_session, demo_user, proj_data):
    """단일 프로젝트 생성 헬퍼"""
    project = models.Project(
        user_id=demo_user.id,
        title=proj_data["title"],
        subtitle=proj_data.get("subtitle"),
        subject_name=proj_data["subject_name"],
        relationship_type=proj_data["relationship_type"],
        status=proj_data["status"],
    )
    db_session.add(project)
    db_session.flush()

    # 커버 사진 설정
    cover_filename = proj_data.get("cover_photo")
    if cover_filename:
        cover_local = os.path.join(SAMPLE_PHOTOS_DIR, cover_filename)
        cover_url = f"/data/sample_photos/{cover_filename}"
        cover_photo = models.Photo(
            project_id=project.id,
            image_url=cover_url,
            local_path=cover_local,
            is_cover=True,
        )
        db_session.add(cover_photo)
        project.cover_image_url = cover_url

    for ch_data in proj_data["chapters"]:
        chapter = models.Chapter(
            project_id=project.id,
            title=ch_data["title"],
            order_index=ch_data["order_index"],
        )
        db_session.add(chapter)
        db_session.flush()

        for q_idx, qna_data in enumerate(ch_data["qnas"]):
            qna = models.QnA(
                chapter_id=chapter.id,
                question_text=qna_data["question"],
                answer_text=qna_data.get("answer"),
                order_index=q_idx + 1,
                skipped=False,
            )
            db_session.add(qna)
            db_session.flush()

            if qna_data.get("photo"):
                photo_filename = qna_data["photo"]
                image_url = f"/data/sample_photos/{photo_filename}"
                local_path = os.path.join(SAMPLE_PHOTOS_DIR, photo_filename)
                photo = models.Photo(
                    qna_id=qna.id,
                    project_id=project.id,
                    image_url=image_url,
                    local_path=local_path,
                    caption=None,
                )
                db_session.add(photo)

    return project


def seed_database(db_session):
    """앱 최초 실행 시 더미 데이터 삽입 (프로젝트별로 중복 체크)"""
    _generate_sample_photos()

    with open(SEED_PATH, encoding="utf-8") as f:
        seed = json.load(f)

    # 데모 전용 사용자 생성
    demo_user = db_session.query(models.User).filter(
        models.User.session_id == DEMO_SESSION_ID
    ).first()
    if not demo_user:
        demo_user = models.User(session_id=DEMO_SESSION_ID)
        db_session.add(demo_user)
        db_session.flush()

    existing_titles = {
        p.title for p in db_session.query(models.Project).filter(
            models.Project.user_id == demo_user.id
        ).all()
    }

    created = []
    for proj_data in seed["projects"]:
        if proj_data["title"] in existing_titles:
            continue
        _create_project_from_data(db_session, demo_user, proj_data)
        created.append(proj_data["title"])

    if created:
        db_session.commit()
        for title in created:
            print(f"✅ 더미 데이터 로드 완료 — '{title}' 프로젝트가 생성되었습니다.")
