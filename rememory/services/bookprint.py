"""BookPrint API SDK helper service."""

import os
import sys
import time
from datetime import datetime

# Add SDK path when the package is not installed globally.
_sdk_path = os.path.join(os.path.dirname(__file__), "..", "..")
if _sdk_path not in sys.path:
    sys.path.insert(0, _sdk_path)

from bookprintapi import ApiError, Client  # noqa: E402
import config


def get_client() -> Client:
    return Client(
        api_key=config.BOOKPRINT_API_KEY,
        environment=config.BOOKPRINT_ENV,
        base_url=config.BOOKPRINT_BASE_URL or None,
    )


def create_book(title: str) -> str:
    """Create a draft book and return its bookUid."""
    client = get_client()
    result = client.books.create(
        book_spec_uid=config.BOOK_SPEC_UID,
        title=title,
        creation_type="TEST",
    )
    return result["data"]["bookUid"]


def upload_photo(book_uid: str, file_path: str) -> str:
    """Upload a photo and return the API fileName."""
    client = get_client()
    result = client.photos.upload(book_uid, file_path)
    return result["data"]["fileName"]


def _season_title(month: int) -> str:
    if month in (3, 4, 5):
        return "봄"
    if month in (6, 7, 8):
        return "여름"
    if month in (9, 10, 11):
        return "가을"
    return "겨울"


def insert_ganji(book_uid: str, chapter_num: int, chapter_date: datetime):
    """Insert a chapter divider page."""
    client = get_client()
    client.contents.insert(
        book_uid,
        template_uid=config.TPL_GANJI,
        parameters={
            "year": str(chapter_date.year),
            "monthTitle": f"{chapter_date.month}월",
            "chapterNum": str(chapter_num),
            "season_title": _season_title(chapter_date.month),
        },
    )
    time.sleep(0.5)


def insert_qna(book_uid: str, question: str, answer: str, photo_file_name: str | None = None):
    """Insert a QnA content page using the diary template format.

    The available template (TPL_QNA = TPL_NAEJI) uses monthNum/dayNum/diaryText.
    Q&A text is packed into diaryText as 'Q. ... \\n\\nA. ...'.
    """
    now = datetime.now()
    diary_text = f"Q. {question}\n\n{answer or ''}"
    client = get_client()
    client.contents.insert(
        book_uid,
        template_uid=config.TPL_QNA,
        parameters={
            "monthNum": str(now.month),
            "dayNum": str(now.day),
            "diaryText": diary_text,
        },
        break_before="page",
    )
    time.sleep(0.5)


def insert_blank(book_uid: str):
    """Insert a blank page."""
    client = get_client()
    client.contents.insert(
        book_uid,
        template_uid=config.TPL_BLANK,
        break_before="page",
    )
    time.sleep(0.5)


def insert_publish(book_uid: str, title: str, author: str, publish_date: str):
    """Insert the publish page."""
    client = get_client()
    client.contents.insert(
        book_uid,
        template_uid=config.TPL_PUBLISH,
        parameters={
            "title": title,
            "publishDate": publish_date,
            "author": author,
        },
        break_before="page",
    )
    time.sleep(0.5)


def clear_contents(book_uid: str):
    """Clear all inserted contents."""
    client = get_client()
    client.contents.clear(book_uid)


def delete_cover(book_uid: str):
    """Delete existing cover (ignore if none exists)."""
    try:
        client = get_client()
        client.covers.delete(book_uid)
    except ApiError:
        pass  # 표지 없으면 무시


def create_cover(
    book_uid: str,
    title: str,
    photo_file_name: str | None = None,
    date_range: str | None = None,
):
    """Create the book cover.

    Template (TPL_COVER) accepts: title, dateRange, coverPhoto.
    """
    if not date_range:
        ym = datetime.now().strftime("%Y.%m")
        date_range = f"{ym} - {ym}"
    client = get_client()
    params: dict = {
        "title": title,
        "dateRange": date_range,
    }
    if photo_file_name:
        params["coverPhoto"] = photo_file_name
    client.covers.create(
        book_uid,
        template_uid=config.TPL_COVER,
        parameters=params,
    )


def finalize_book(book_uid: str, max_retries: int = 5) -> dict:
    """Finalize the book, padding blank pages if the minimum is not met."""
    client = get_client()
    for attempt in range(max_retries):
        try:
            result = client.books.finalize(book_uid)
            return result.get("data", {})
        except ApiError as e:
            if "최소 페이지" in str(e.details) and attempt < max_retries - 1:
                for _ in range(4):
                    insert_blank(book_uid)
            else:
                raise
    return {}


def get_estimate(book_uid: str, quantity: int = 1) -> dict:
    """Get price estimate."""
    client = get_client()
    result = client.orders.estimate([{"bookUid": book_uid, "quantity": quantity}])
    return result.get("data", {})


def create_order(book_uid: str, quantity: int, shipping: dict) -> dict:
    """Create an order."""
    client = get_client()
    result = client.orders.create(
        items=[{"bookUid": book_uid, "quantity": quantity}],
        shipping=shipping,
    )
    return result.get("data", {})


def get_order(order_uid: str) -> dict:
    """Get order details."""
    client = get_client()
    result = client.orders.get(order_uid)
    return result.get("data", {})


def cancel_order(order_uid: str, reason: str) -> dict:
    """Cancel an order."""
    client = get_client()
    result = client.orders.cancel(order_uid, reason)
    return result.get("data", {})


def get_credit_balance() -> int:
    """Get current credit balance."""
    client = get_client()
    result = client.credits.get_balance()
    return result["data"].get("balance", 0)


def sandbox_charge(amount: int) -> dict:
    """Charge sandbox credits."""
    client = get_client()
    result = client.credits.sandbox_charge(amount, memo="Re:Memory sandbox charge")
    return result.get("data", {})
