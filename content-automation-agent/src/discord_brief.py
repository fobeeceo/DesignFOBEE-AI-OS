"""
discord_brief.py — Discord Morning Brief 조립기 (업무지시서 v1.1 Priority 4).
ERP KPI·긴급재고·승인대기발주는 이 저장소의 실데이터(erp_engine.py)로 채운다.
날씨·AI뉴스·정부지원사업은 이 스크립트가 직접 조회할 수 없다(외부 API 자격증명 없음) —
호출자(예: 웹서치 도구를 가진 Claude Code 세션)가 실제로 조회한 값을 인자로 넘겨야 한다.
값을 못 구했으면 None으로 두면 정직하게 "확인 필요"로 표시한다(추측 데이터 생성 금지).
"오늘의 말씀"은 특정 종교 콘텐츠 선택이 필요해 이 스크립트가 임의로 생성하지 않는다 —
CEO가 지정한 소스(devotional API/수동 입력)가 있을 때만 채운다.
"""
from __future__ import annotations
import datetime
import sys
from erp_engine import dashboard


def _fmt_list(items: list[str] | None, empty_note: str) -> str:
    if not items:
        return f"- {empty_note}"
    return "\n".join(f"{i + 1}. {v}" for i, v in enumerate(items))


def build_ceo_question(dash: dict) -> str:
    """ERP 실데이터 기반 CEO Question 자동 생성(추측 없음 — dashboard() 산출물만 사용)."""
    urgent = dash.get("긴급발주", 0)
    if urgent > 0:
        return f"오늘 긴급 발주 {urgent}건이 대기 중입니다 — 어떤 기준으로 우선순위를 정하시겠습니까?"
    candidates = dash.get("단종후보") or []
    if candidates:
        return f"메뉴 엔지니어링에서 단종 후보로 나온 {', '.join(candidates)} — 실제로 단종을 검토하시겠습니까?"
    return "오늘 특별히 점검하고 싶은 지표가 있으신가요?"


def build_brief(
    *,
    weather: str | None = None,
    ai_news: list[str] | None = None,
    gov_programs: list[str] | None = None,
    verse: str | None = None,
    date: str | None = None,
) -> str:
    """8개 섹션을 Discord Markdown으로 조립. 값이 없는 섹션은 "확인 필요"로 정직 표시."""
    dash = dashboard()
    d = date or datetime.date.today().isoformat()
    ceo_question = build_ceo_question(dash)

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
- {dash.get('긴급발주', 0)}건 (전체 재고부족 {dash.get('재고부족', 0)}건)
{_fmt_list(dash.get('발주추천_TOP3'), '긴급 발주 없음')}

**⑥ 승인 대기 발주**
- Notion "AI 발주 승인" 큐에서 직접 확인 필요(이 스크립트는 로컬 ERP 추천 건수만 앎, 실제 승인 상태는 Notion이 SSOT)

**⑦ 오늘의 말씀**
{verse or "확인 필요 (CEO 지정 소스 없음 — 자동 생성하지 않음)"}

**⑧ CEO Question**
{ceo_question}
"""


if __name__ == "__main__":
    # Windows 콘솔 기본 코드페이지(cp949)가 이모지/한글 혼합 출력을 못 받는 문제 방지.
    sys.stdout.reconfigure(encoding="utf-8")
    print(build_brief())
