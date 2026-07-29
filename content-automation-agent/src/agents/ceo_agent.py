"""
CEOAgent
Input: ERPAgent.run()의 산출물(dashboard dict).
Process: 오늘 실데이터(긴급발주 건수·단종후보)를 규칙 기반으로 살펴 CEO가 결정할 만한
  질문 하나를 고른다(LLM 생성 아님 — 재현 가능한 규칙, 추측 데이터 없음).
Output: 질문 문자열 1개.
"""
from __future__ import annotations


def run(dash: dict) -> str:
    urgent = dash.get("긴급발주", 0)
    if urgent > 0:
        return f"오늘 긴급 발주 {urgent}건이 대기 중입니다 — 어떤 기준으로 우선순위를 정하시겠습니까?"
    candidates = dash.get("단종후보") or []
    if candidates:
        return f"메뉴 엔지니어링에서 단종 후보로 나온 {', '.join(candidates)} — 실제로 단종을 검토하시겠습니까?"
    return "오늘 특별히 점검하고 싶은 지표가 있으신가요?"
