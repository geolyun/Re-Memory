from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    name = Column(String, default="익명")
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    subtitle = Column(String, nullable=True)
    subject_name = Column(String)
    relationship_type = Column(String)
    cover_image_url = Column(String, nullable=True)    # 로컬 정적 파일 URL
    cover_api_filename = Column(String, nullable=True) # API 업로드 후 fileName
    book_uid = Column(String, nullable=True)           # BookPrint API 책 UID
    order_uid = Column(String, nullable=True)          # BookPrint API 주문 UID
    share_token = Column(String, nullable=True, unique=True, index=True)  # 공동 작성 공유 토큰
    # draft → writing → building → preview_ready → finalized → ordered
    status = Column(String, default="draft")
    page_count = Column(Integer, nullable=True)        # 확정 후 총 페이지 수
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    chapters = relationship("Chapter", back_populates="project", order_by="Chapter.order_index",
                            cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="project", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String)
    order_index = Column(Integer)

    project = relationship("Project", back_populates="chapters")
    qnas = relationship("QnA", back_populates="chapter", order_by="QnA.order_index",
                        cascade="all, delete-orphan")


class QnA(Base):
    __tablename__ = "qnas"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    question_text = Column(Text)
    hint_text = Column(Text, nullable=True)
    placeholder_text = Column(Text, nullable=True)
    answer_text = Column(Text, nullable=True)
    time_period = Column(String, nullable=True)   # 답변이 속한 인생 시기 (타임라인용)
    order_index = Column(Integer)
    skipped = Column(Boolean, default=False)

    chapter = relationship("Chapter", back_populates="qnas")
    photos = relationship("Photo", back_populates="qna", cascade="all, delete-orphan")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    qna_id = Column(Integer, ForeignKey("qnas.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    image_url = Column(String)        # 로컬 정적 파일 URL (/uploads/...)
    local_path = Column(String)       # 실제 파일시스템 경로
    api_file_name = Column(String, nullable=True)  # API 업로드 후 fileName
    caption = Column(String, nullable=True)
    is_cover = Column(Boolean, default=False)

    qna = relationship("QnA", back_populates="photos")
    project = relationship("Project", back_populates="photos")
