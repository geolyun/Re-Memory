from pathlib import Path
import os
import sys

import uvicorn

ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / "rememory"

os.chdir(APP_DIR)
sys.path.insert(0, str(APP_DIR))

uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
