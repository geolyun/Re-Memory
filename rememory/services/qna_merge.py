"""Helpers for merging owner answers with shared contributions."""

import models


def _clean_text(value: str | None) -> str:
    return (value or "").strip()


def format_contribution(contribution: models.Contribution) -> str:
    text = _clean_text(contribution.answer_text)
    if not text:
        return ""
    contributor_name = _clean_text(contribution.contributor_name)
    if contributor_name:
        return f"[{contributor_name}] {text}"
    return text


def merged_answer_text(qna: models.QnA) -> str:
    parts: list[str] = []

    owner_answer = _clean_text(qna.answer_text)
    if owner_answer:
        parts.append(owner_answer)

    for contribution in qna.contributions:
        contribution_text = format_contribution(contribution)
        if contribution_text:
            parts.append(contribution_text)

    return "\n\n".join(parts)


def merged_time_period(qna: models.QnA) -> str:
    owner_time_period = _clean_text(qna.time_period)
    if owner_time_period:
        return owner_time_period

    for contribution in reversed(qna.contributions):
        contribution_time_period = _clean_text(contribution.time_period)
        if contribution_time_period:
            return contribution_time_period

    return ""


def has_merged_answer(qna: models.QnA) -> bool:
    return bool(merged_answer_text(qna))
