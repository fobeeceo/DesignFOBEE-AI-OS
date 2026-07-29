"""
DashboardAgent
Input: ERPAgent.run()의 산출물(dashboard dict).
Process: 브리핑·CEO Dashboard에 필요한 "긴급재고·발주추천" 부분만 추려낸다(재계산 없음 —
  ERPAgent가 이미 계산한 값을 그대로 옮긴다. 중복 계산 금지 원칙).
Output: {urgentCount, shortageCount, top} 형태의 요약 dict.
"""
from __future__ import annotations


def run(dash: dict) -> dict:
    return {
        "urgentCount": dash.get("긴급발주", 0),
        "shortageCount": dash.get("재고부족", 0),
        "top": dash.get("발주추천_TOP3", []),
    }
