"""
discord_brief.py — Discord Morning Brief 오케스트레이터 (업무지시서 v1.1 Priority 4~5).
8개 섹션 각각의 Input/Process/Output은 agents/ 아래 각 Agent가 전담한다(중복 계산 없음).
이 파일은 Agent들을 순서대로 호출해 Discord Markdown 한 장으로 조립하는 역할만 한다.
"""
from __future__ import annotations
import datetime
import sys

from agents import (
    weather_agent,
    news_agent,
    government_agent,
    bible_agent,
    ceo_agent,
    dashboard_agent,
    erp_agent,
)


def _fmt_list(items: list[str] | None, empty_note: str) -> str:
    if not items:
        return f"- {empty_note}"
    return "\n".join(f"{i + 1}. {v}" for i, v in enumerate(items))


def build_brief(
    *,
    weather_raw: str | None = None,
    ai_news_raw: list[str] | None = None,
    gov_programs_raw: list[str] | None = None,
    verse: str | None = None,
    date: str | None = None,
) -> str:
    """각 Agent의 Output만 모아 Discord Markdown으로 조립. 값이 없는 섹션은 "확인 필요"로 정직 표시."""
    dash = erp_agent.run()
    board = dashboard_agent.run(dash)
    weather = weather_agent.run(weather_raw)
    ai_news = news_agent.run(ai_news_raw)
    gov_programs = government_agent.run(gov_programs_raw)
    today_verse = bible_agent.run(verse)
    ceo_question = ceo_agent.run(dash)

    d = date or datetime.date.today().isoformat()
    sales = dash.get("매출_POS") or {}
    return f"""# ☀️ GBRICK AI HQ — Morning Brief ({d})

**① 오늘 날씨**
{weather or "확인 필요 (날씨 조회 결과 없음)"}

**② AI News TOP5**
{_fmt_list(ai_news, "확인 필요 (뉴스 조회 결과 없음)")}

**③ 정부지원사업**
{_fmt_list(gov_programs, "확인 필요 (지원사업 조회 결과 없음)")}

**④ ERP KPI**
- 매출(POS 기준): {sales.get('매출_순액')}
- 평균 원가율: {dash.get('평균원가율')}
- 판매순위 TOP3: {', '.join(sales.get('판매순위_TOP3') or []) or '확인 필요'}

**⑤ 긴급 재고**
- {board['urgentCount']}건 (전체 재고부족 {board['shortageCount']}건)
{_fmt_list(board['top'], '긴급 발주 없음')}

**⑥ 승인 대기 발주**
- Notion "AI 발주 승인" 큐에서 직접 확인 필요(이 스크립트는 로컬 ERP 추천 건수만 앎, 실제 승인 상태는 Notion이 SSOT)

**⑦ 오늘의 말씀**
{today_verse or "확인 필요 (CEO 지정 소스 없음 — 자동 생성하지 않음)"}

**⑧ CEO Question**
{ceo_question}
"""


if __name__ == "__main__":
    # Windows 콘솔 기본 코드페이지(cp949)가 이모지/한글 혼합 출력을 못 받는 문제 방지.
    sys.stdout.reconfigure(encoding="utf-8")
    print(build_brief())
