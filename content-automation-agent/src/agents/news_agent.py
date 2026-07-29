"""
NewsAgent
Input: 호출자가 WebSearch로 실제 조회한 AI 뉴스 헤드라인 목록(list[str]) — 이 Agent는
  스스로 뉴스 API를 호출하지 않는다(이 코드베이스에 뉴스 API 자격증명이 없음).
Process: 상위 5건으로 자르기만 한다(내용 생성·요약 왜곡 없음).
Output: 최대 5건의 헤드라인 리스트.
"""
from __future__ import annotations


def run(headlines: list[str] | None) -> list[str]:
    return (headlines or [])[:5]
