"""
Content Planner — 콘텐츠 기획 카드 에이전트.

Input:  brand: str, topic: str, trend_output: dict,
        audience_output: dict, channel_strategy: dict
Process: 입력 데이터 → Gemini로 콘텐츠 기획 카드 3개 생성 → 최우선 1개 선정.
         근거 없는 추천 금지 — 카드마다 근거·검증가설 필수.
Output: {content_cards: [3개], recommended_index: int, recommendation_reason: str,
         title_candidates: [3개], hook_candidates: [3개], available}
"""
from __future__ import annotations
import sys
import pathlib
import json

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from marketing_llm import call_llm, parse_json_safe, load_brand

_CARD_SCHEMA = json.dumps({
    "content_cards": [
        {
            "index": 0,
            "title": "",
            "hook_sentence": "",
            "structure": ["장면1", "장면2", "장면3"],
            "cta": "",
            "target_segment": "",
            "platform": "",
            "basis": "",
            "test_hypothesis": ""
        }
    ],
    "recommended_index": 0,
    "recommendation_reason": "",
    "title_candidates": ["", "", ""],
    "hook_candidates": ["", "", ""]
})


def run(brand: str, topic: str, trend_output: dict,
        audience_output: dict, channel_strategy: dict) -> dict:
    brand_cfg = load_brand(brand)
    brand_name = brand_cfg.get("brand_name_ko", brand)
    goals = ", ".join(brand_cfg.get("marketing_goals", []))
    facts = "\n".join(f"- {f}" for f in brand_cfg.get("ssot_facts", []))
    prohibited = ", ".join(brand_cfg.get("prohibited_claims", []))
    keywords = trend_output.get("키워드", [])
    segments = audience_output.get("target_segments", [])
    top_channel = (brand_cfg.get("channel_priority") or ["tiktok"])[0]

    prompt = (
        f"당신은 {brand_name} 브랜드의 콘텐츠 기획자다. 아래 조건으로 15~20초 숏폼 콘텐츠 기획 카드 3개를 작성하라.\n\n"
        f"[주제] {topic}\n"
        f"[마케팅 목표] {goals}\n"
        f"[SSOT 팩트 — 이것만 인용 가능]\n{facts if facts else 'DATA_MISSING'}\n"
        f"[금지 표현/수치] {prohibited if prohibited else '없음'}\n"
        f"[트렌드 키워드] {', '.join(keywords[:5]) if keywords else 'DATA_MISSING'}\n"
        f"[타깃 세그먼트] {', '.join(segments[:3]) if segments else 'DATA_MISSING'}\n"
        f"[주력 채널] {top_channel}\n\n"
        f"각 카드에 반드시 포함: index(0/1/2), title(제목), hook_sentence(첫 3초 후킹 1줄),\n"
        f"structure(장면 구성 3개), cta, target_segment, platform, basis(추천 근거), test_hypothesis(검증 가설)\n"
        f"마지막에 recommended_index(최우선 카드 번호), recommendation_reason,\n"
        f"title_candidates(제목 후보 3개), hook_candidates(후킹 후보 3개)\n\n"
        f"금지: SSOT 외 수치 사용, 금지 표현 포함, 근거 없는 추천\n"
        f"JSON 스키마로만 응답(다른 텍스트 금지): {_CARD_SCHEMA}"
    )

    raw, live = call_llm("Content Planner", prompt, json_mode=True)
    parsed = parse_json_safe(raw, {}) if live else {}

    fallback_card = {
        "index": 0,
        "title": f"[DRY-RUN] {topic}",
        "hook_sentence": "DATA_MISSING — Gemini 미연결",
        "structure": ["장면1", "장면2", "장면3"],
        "cta": "DATA_MISSING",
        "target_segment": "DATA_MISSING",
        "platform": top_channel,
        "basis": "DATA_MISSING",
        "test_hypothesis": "DATA_MISSING",
    }

    cards = parsed.get("content_cards", [fallback_card])
    # index 필드 보정
    for i, card in enumerate(cards):
        card["index"] = i

    return {
        "content_cards": cards,
        "recommended_index": parsed.get("recommended_index", 0),
        "recommendation_reason": parsed.get("recommendation_reason", "DATA_MISSING"),
        "title_candidates": parsed.get("title_candidates", ["DATA_MISSING"] * 3),
        "hook_candidates": parsed.get("hook_candidates", ["DATA_MISSING"] * 3),
        "available": live,
        "brand": brand,
        "topic": topic,
    }
