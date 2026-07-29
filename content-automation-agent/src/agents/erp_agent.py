"""
ERPAgent
Input: 없음 — 로컬 산출물(재고관리 DB·POS 스냅샷)을 erp_engine이 직접 읽는다.
Process: erp_engine.dashboard()를 실행해 매출·원가·재고·발주 KPI를 계산한다.
Output: dashboard() 원본 dict(추가 가공 없음 — 다른 Agent가 필요한 부분만 골라 쓴다).
"""
from __future__ import annotations
from erp_engine import dashboard as _dashboard


def run() -> dict:
    return _dashboard()
