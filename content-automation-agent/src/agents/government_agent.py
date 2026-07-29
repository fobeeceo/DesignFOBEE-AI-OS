"""
GovernmentAgent
Input: 호출자가 WebSearch로 실제 조회한 정부지원사업 공고 목록(list[str]) — 이 Agent는
  스스로 bizinfo.go.kr 등을 조회하지 않는다(전용 API 자격증명 없음, WebSearch로 대체).
Process: 중복 제거만 한다(순서는 유지 — 검색 결과의 관련도 순서를 임의로 재배열하지 않는다).
Output: 중복 제거된 공고 목록.
"""
from __future__ import annotations


def run(programs: list[str] | None) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for p in programs or []:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out
