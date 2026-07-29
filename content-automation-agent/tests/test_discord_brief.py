"""discord_brief 조립 테스트 — 값이 없는 섹션은 정직하게 "확인 필요"로만 표시되는지 확인."""
from discord_brief import build_brief


def test_brief_shows_honest_placeholders_when_no_external_data():
    text = build_brief()
    assert "확인 필요" in text
    assert "① 오늘 날씨" in text
    assert "⑧ CEO Question" in text
    # 종교 콘텐츠를 스스로 생성하지 않는다는 계약 확인.
    assert "자동 생성하지 않음" in text


def test_brief_includes_supplied_external_data_verbatim():
    text = build_brief(
        weather_raw="맑음 30도",
        ai_news_raw=["뉴스A", "뉴스B"],
        gov_programs_raw=["지원사업A"],
        verse="테스트 구절",
    )
    assert "맑음 30도" in text
    assert "뉴스A" in text
    assert "지원사업A" in text
    assert "테스트 구절" in text


def test_brief_always_includes_real_erp_kpi_section():
    text = build_brief()
    assert "④ ERP KPI" in text
    assert "평균 원가율" in text
