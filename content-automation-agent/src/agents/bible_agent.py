"""
BibleAgent
Input: CEO가 지정한 오늘의 말씀 소스(문자열, 예: devotional API 결과나 수동 입력) — 없으면 None.
Process: 아무것도 하지 않는다 — 이 Agent는 성경 구절이나 다른 종교 텍스트를 스스로 생성하지
  않는다(저작권·개인적 선택이 필요한 민감 콘텐츠). CEO가 소스를 지정할 때까지 그대로 둔다.
Output: 지정된 구절 문자열, 없으면 None.
"""
from __future__ import annotations


def run(configured_verse: str | None) -> str | None:
    return configured_verse
