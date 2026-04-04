from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """기존 DB에 새 컬럼 추가 (없는 경우에만)"""
    with engine.connect() as conn:
        # qnas 테이블 마이그레이션
        result = conn.execute(text("PRAGMA table_info(qnas)"))
        qna_columns = [row[1] for row in result]
        if "hint_text" not in qna_columns:
            conn.execute(text("ALTER TABLE qnas ADD COLUMN hint_text TEXT"))
        if "placeholder_text" not in qna_columns:
            conn.execute(text("ALTER TABLE qnas ADD COLUMN placeholder_text TEXT"))
        if "time_period" not in qna_columns:
            conn.execute(text("ALTER TABLE qnas ADD COLUMN time_period VARCHAR"))

        # projects 테이블 마이그레이션
        result = conn.execute(text("PRAGMA table_info(projects)"))
        project_columns = [row[1] for row in result]
        if "share_token" not in project_columns:
            conn.execute(text("ALTER TABLE projects ADD COLUMN share_token VARCHAR"))

        conn.commit()


def run_seed():
    """테이블 생성 후 더미 데이터 삽입 (최초 1회)"""
    from seed import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
