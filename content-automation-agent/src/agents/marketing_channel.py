"""
Channel Strategist — 채널별 콘텐츠 전략 에이전트.

Input:  brand: str, audience_output: dict, trend_output: dict
Process: 브랜드 채널 우선순위 + 타깃 분석 → Gemini로 플랫폼별 전략 생성.
         전략만 생성 — 실제 게시 API 호출 없음.
Output: {channels: {tiktok, instagram_reels, youtube_shorts, naver_blog, google_blog},
         available}
         각 채널: {format, duration_sec, optimal_post_time, cta_type, notes}
"""
from __future__ import annotations
import sys
import pathlib
import json

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from marketing_llm import call_llm, parse_json_safe, load_brand

_CHANNELS = ["tiktok", "instagram_reels", "youtube_shorts", "naver_blog", "google_blog"]

_SCHEMA = json.dumps({
    ch: {"format": "", "duration_sec": 0, "optimal_post_time": "", "cta_type": "", "notes": ""}
    for ch in _CHANNELS
})


def run(brand: str, audience_output: dict, trend_output: dict) -> dict:
    brand_cfg = load_brand(brand)
    brand_name = brand_cfg.get("brand_name_ko", brand)
    priority = brand_cfg.get("channel_priority", _CHANNELS)
    goals = ", ".join(brand_cfg.get("marketing_goals", []))
    segments = audience_output.get("target_segments", [])
    keywords = trend_output.get("키워드", [])

    prompt = (
        f"당신은 {brand_name}의 SNS 채널 전략가다. 아래 정보를 바탕으로 각 플랫폼별 전략을 수립하라.\n\n"
        f"[마케팅 목표] {goals}\n"
        f"[주요 채널 우선순위] {', '.join(priority)}\n"
        f"[타깃 세그먼트] {', '.join(segments[:3]) if segments else 'DATA_MISSING'}\n"
        f"[트렌드 키워드] {', '.join(keywords[:5]) if keywords else 'DATA_MISSING'}\n\n"
        f"각 채널(tiktok/instagram_reels/youtube_shorts/naver_blog/google_blog)에 대해:\n"
        f"- format: 권장 영상/포스트 형식\n"
        f"- duration_sec: 권장 길이(초)\n"
        f"- optimal_post_time: 권장 게시 시간대(한국 기준)\n"
        f"- cta_type: 효과적인 CTA 유형\n"
        f"- notes: 해당 브랜드/플랫폼 특이사항\n\n"
        f"JSON 스키마로만 응답(다른 텍스트 금지): {_SCHEMA}"
    )

    raw, live = call_llm("Channel Strategist", prompt, json_mode=True)
    parsed = parse_json_safe(raw, {}) if live else {}

    channels: dict = {}
    for ch in _CHANNELS:
        if ch in parsed and isinstance(parsed[ch], dict):
            channels[ch] = parsed[ch]
        else:
            channels[ch] = {
                "format": "DATA_MISSING",
                "duration_sec": 0,
                "optimal_post_time": "DATA_MISSING",
                "cta_type": "DATA_MISSING",
                "notes": "Gemini 미연결 — 채널 전략 생성 불가",
            }

    return {"channels": channels, "available": live, "brand": brand}
