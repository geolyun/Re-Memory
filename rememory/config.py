from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = str(BASE_DIR / "uploads")
DEFAULT_DB_PATH = BASE_DIR / "rememory.db"

load_dotenv(ENV_PATH)

BOOKPRINT_API_KEY = os.getenv("BOOKPRINT_API_KEY", "")
BOOKPRINT_ENV = os.getenv("BOOKPRINT_ENV", "sandbox")
BOOKPRINT_BASE_URL = os.getenv("BOOKPRINT_BASE_URL", "")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

MAX_PHOTO_SIZE = 2 * 1024 * 1024

TPL_COVER = os.getenv("TPL_COVER", "79yjMH3qRPly")
TPL_GANJI = os.getenv("TPL_GANJI", "5M3oo7GlWKGO")
TPL_QNA = os.getenv("TPL_QNA", "5B4ds6i0Rywx")
TPL_QNA_WITH_PHOTO = os.getenv("TPL_QNA_WITH_PHOTO", "46VqZhVNOfAp")
TPL_BLANK = os.getenv("TPL_BLANK", "2mi1ao0Z4Vxl")
TPL_PUBLISH = os.getenv("TPL_PUBLISH", "5nhOVBjTnIVE")

BOOK_SPEC_UID = os.getenv("BOOK_SPEC_UID", "SQUAREBOOK_HC")
MIN_PAGES = int(os.getenv("MIN_PAGES", "0"))

_raw_ganji_tpls = os.getenv("GANJI_TEMPLATE_OPTIONS", f"{TPL_GANJI}:기본")
GANJI_TEMPLATES: list[dict] = []
for _entry in _raw_ganji_tpls.split(","):
    _parts = _entry.strip().split(":", 1)
    GANJI_TEMPLATES.append(
        {
            "uid": _parts[0],
            "name": _parts[1] if len(_parts) > 1 else f"옵션 {len(GANJI_TEMPLATES) + 1}",
        }
    )
