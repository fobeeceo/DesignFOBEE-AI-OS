"""Agent 유닛 테스트 — 각 Agent의 Input/Process/Output 계약을 확인한다."""
from agents import (
    weather_agent,
    news_agent,
    government_agent,
    bible_agent,
    ceo_agent,
    dashboard_agent,
)


def test_weather_agent_passthrough_and_trim():
    assert weather_agent.run("  맑음 28도  ") == "맑음 28도"


def test_weather_agent_none_when_no_input():
    assert weather_agent.run(None) is None
    assert weather_agent.run("") is None


def test_news_agent_caps_at_five():
    headlines = [f"뉴스{i}" for i in range(10)]
    result = news_agent.run(headlines)
    assert len(result) == 5
    assert result[0] == "뉴스0"


def test_news_agent_empty_when_no_input():
    assert news_agent.run(None) == []


def test_government_agent_dedupes_preserving_order():
    result = government_agent.run(["공고A", "공고B", "공고A", "공고C"])
    assert result == ["공고A", "공고B", "공고C"]


def test_bible_agent_never_invents_content():
    assert bible_agent.run(None) is None
    assert bible_agent.run("CEO가 지정한 구절") == "CEO가 지정한 구절"


def test_ceo_agent_prioritizes_urgent_orders():
    dash = {"긴급발주": 2, "단종후보": ["메뉴A"]}
    q = ceo_agent.run(dash)
    assert "긴급 발주 2건" in q


def test_ceo_agent_falls_back_to_discontinue_candidates():
    dash = {"긴급발주": 0, "단종후보": ["메뉴A", "메뉴B"]}
    q = ceo_agent.run(dash)
    assert "메뉴A, 메뉴B" in q


def test_ceo_agent_default_question_when_nothing_notable():
    dash = {"긴급발주": 0, "단종후보": []}
    q = ceo_agent.run(dash)
    assert q == "오늘 특별히 점검하고 싶은 지표가 있으신가요?"


def test_dashboard_agent_extracts_expected_fields():
    dash = {"긴급발주": 3, "재고부족": 15, "발주추천_TOP3": ["딸기라떼소분 6개"]}
    board = dashboard_agent.run(dash)
    assert board == {"urgentCount": 3, "shortageCount": 15, "top": ["딸기라떼소분 6개"]}


def test_dashboard_agent_defaults_when_keys_missing():
    board = dashboard_agent.run({})
    assert board == {"urgentCount": 0, "shortageCount": 0, "top": []}
