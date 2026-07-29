"""
WeatherAgent
Input: 호출자가 WebSearch 등으로 실제 조회한 오늘자 날씨 원문 요약(문자열) — 이 Agent는
  스스로 날씨 API를 호출하지 않는다(이 코드베이스에 날씨 API 자격증명이 없음).
Process: 공백 정리만 한다(새로운 사실을 추가/추측하지 않는다).
Output: 정리된 날씨 문자열, Input이 없으면 None(추측 대신 정직하게 없음을 알림).
"""
from __future__ import annotations


def run(raw: str | None) -> str | None:
    if not raw:
        return None
    return raw.strip()
