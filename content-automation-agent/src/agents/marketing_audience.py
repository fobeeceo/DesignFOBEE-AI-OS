"""
Audience Analyst — 타깃 고객 분석 에이전트.

Input:  brand: str, trend_output: dict (Trend Researcher 출력),
        platform: str ("tiktok"|"instagram_reels"|"youtube_shorts"|"naver_blog"|"all")
Process: 트렌드 키워드 + 브랜드 타깃 → Gemini로 고객 세그먼트·관심사·문제·검색의도 분석.
         실제 계정 분석 데이터(팔로워 통계 등)는 접근 권한 없음 → DATA_MISSING 표시.
         Gemini 없으면 dry-run 스텁.
Output: {target_segments, core_interests, customer_problems, search_intent,
         platform_notes, available, data_source_note}
"""
from __future__ import annotations
import sys
import pathlib
import json

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from marketing_llm import call_llm, parse_json_safe, load_brand

_SCHEMA = '{"target_segments":[""],"core_interests":[""],"customer_problems":[""],"search_intent":[""],"platform_notes":{"tiktok":"","instagram_reels":"","youtube_shorts":"","naver_blog":""}}'


def run(brand: str, trend_output: dict, platform: str = "all") -> dict:
    brand_cfg = load_brand(brand)
    brand_name = brand_cfg.get("brand_name_ko", brand)
    targets = brand_cfg.get("primary_targets", [])
    targets_text = "\n".join(f"- {t['segment']}: {t['goal']}" for t in targets)
    goals = ", ".join(brand_cfg.get("marketing_goals", []))

    keywords = trend_output.get("키워드", [])
    opportunities = trend_output.get("기회", [])
    kw_text = ", ".join(keywords) if keywords else "DATA_MISSING"
    opp_text = "\n".join(f"- {o}" for o in opportunities) if opportunities else "DATA_MISSING"

    prompt = (
        f"당신은 {brand_name} 브랜드의 타깃 고객 분석가다. 아래 트렌드와 브랜드 정보를 바탕으로:\n\n"
        f"[브랜드 목표] {goals}\n"
        f"[기존 타깃]\n{targets_text}\n"
        f"[트렌드 키워드] {kw_text}\n"
        f"[콘텐츠 기회]\n{opp_text}\n\n"
        f"다음을 분석하라(추측이면 [추론] 표시, 실계정 통계 없으면 DATA_MISSING):\n"
        f"1) 세부 타깃 세그먼트 3개\n"
        f"2) 핵심 관심사 5개\n"
        f"3) 고객 문제·니즈 3개\n"
        f"4) 검색/탐색 의도 3개\n"
        f"5) 플랫폼별 타깃 특성 (tiktok/instagram_reels/youtube_shorts/naver_blog)\n\n"
        f"JSON 스키마로만 응답(다른 텍스트 금지): {_SCHEMA}"
    )

    raw, live = call_llm("Audience Analyst", prompt, json_mode=True)
    parsed = parse_json_safe(raw, {}) if live else {}

    return {
        "target_segments": parsed.get("target_segments", ["[추론] 해당 브랜드 주요 타깃"]),
        "core_interests": parsed.get("core_interests", ["DATA_MISSING — Gemini 미연결"]),
        "customer_problems": parsed.get("customer_problems", ["DATA_MISSING"]),
        "search_intent": parsed.get("search_intent", ["DATA_MISSING"]),
        "platform_notes": parsed.get("platform_notes", {}),
        "available": live,
        "data_source_note": "실계정 팔로워 통계 없음 — Gemini 트렌드 기반 추론, [추론] 표시된 항목은 검증 필요",
        "brand": brand,
    }
