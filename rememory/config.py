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
MIN_PAGES     = int(os.getenv("MIN_PAGES", "0"))

# 간지 템플릿 선택 목록: 쉼표로 구분된 "UID:이름" 형식
# 예: "79yjMH3qRPly:클래식,AbCdEfGhIjKl:모던"
# 이름 생략 시 "스타일 N" 으로 표시
_raw_ganji_tpls = os.getenv("GANJI_TEMPLATE_OPTIONS", f"{TPL_GANJI}:기본")
GANJI_TEMPLATES: list[dict] = []
for _entry in _raw_ganji_tpls.split(","):
    _parts = _entry.strip().split(":", 1)
    GANJI_TEMPLATES.append({"uid": _parts[0], "name": _parts[1] if len(_parts) > 1 else f"스타일 {len(GANJI_TEMPLATES)+1}"})
