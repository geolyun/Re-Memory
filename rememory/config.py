import os
from dotenv import load_dotenv

load_dotenv()

BOOKPRINT_API_KEY = os.getenv("BOOKPRINT_API_KEY", "")
BOOKPRINT_ENV = os.getenv("BOOKPRINT_ENV", "sandbox")
BOOKPRINT_BASE_URL = os.getenv("BOOKPRINT_BASE_URL", "")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rememory.db")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
MAX_PHOTO_SIZE = 2 * 1024 * 1024  # 2MB

# Book Print API 템플릿 UID — api.sweetbook.com 파트너 포털에서 확인 후 설정
TPL_COVER   = os.getenv("TPL_COVER",   "79yjMH3qRPly")
TPL_GANJI   = os.getenv("TPL_GANJI",   "5M3oo7GlWKGO")
TPL_QNA     = os.getenv("TPL_QNA",     "5B4ds6i0Rywx")
TPL_BLANK   = os.getenv("TPL_BLANK",   "2mi1ao0Z4Vxl")
TPL_PUBLISH = os.getenv("TPL_PUBLISH", "5nhOVBjTnIVE")

BOOK_SPEC_UID = os.getenv("BOOK_SPEC_UID", "SQUAREBOOK_HC")
MIN_PAGES     = int(os.getenv("MIN_PAGES", "24"))
