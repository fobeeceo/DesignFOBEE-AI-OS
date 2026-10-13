"""
Publishing Coordinator — 게시 준비 문서 에이전트.

Input:  brand: str, video_output: dict, channel_strategy: dict,
        content_card: dict, brand_qa_result: dict
Process: Brand QA가 passed=False이면 즉시 중단 — 게시 준비 문서 생성 안 함.
         QA 통과 시 플랫폼별 게시 문구·해시태그·CTA·일정표 생성.
         실제 게시 API 호출 없음 (§8 — 게시 자동화는 별도 승인 필요).
Output: {platforms: {tiktok, instagram_reels, youtube_shorts},
         schedule: [{date, platform, title}],
         blocked_reason: str|None, available}
"""
from __future__ import annotations
import sys
import pathlib
import json
import datetime

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from marketing_llm import call_llm, parse_json_safe, load_brand

_PUB_SCHEMA = json.dumps({
    "tiktok": {"caption": "", "hashtags": [], "cta": "", "recommended_time": ""},
    "instagram_reels": {"caption": "", "hashtags": [], "cta": "", "recommended_time": ""},
    "youtube_shorts": {"caption": "", "hashtags": [], "cta": "", "recommended_time": ""},
})


def run(brand: str, video_output: dict, channel_strategy: dict,
        content_card: dict, brand_qa_result: dict) -> dict:

    # Brand QA 실패 → 게시 준비 중단
    if not brand_qa_result.get("passed", False):
        return {
            "platforms": {},
            "schedule": [],
            "blocked_reason": f"Brand QA 미통과 — 위반항목: {brand_qa_result.get('violations', [])}",
            "available": False,
            "brand": brand,
        }

    brand_cfg = load_brand(brand)
    brand_name = brand_cfg.get("brand_name_ko", brand)
    legal = brand_cfg.get("legal_notice", "")
    title = content_card.get("title", "콘텐츠 제목")
    hook = video_output.get("hook", "")
    cta = content_card.get("cta", "")
    full_script_preview = video_output.get("full_script", "")[:200]

    prompt = (
        f"당신은 {brand_name}의 SNS 게시 담당자다. 아래 콘텐츠로 각 채널 게시 문구를 작성하라.\n\n"
        f"[제목] {title}\n"
        f"[후킹] {hook}\n"
        f"[CTA] {cta}\n"
        f"[대본 요약] {full_script_preview}\n"
        f"{'[법정고지 — 반드시 포함] ' + legal if legal else ''}\n\n"
        f"각 채널(tiktok/instagram_reels/youtube_shorts) 게시 준비:\n"
        f"- caption: 게시 문구 (채널 특성에 맞게)\n"
        f"- hashtags: 해시태그 목록 (# 없이)\n"
        f"- cta: CTA 문구\n"
        f"- recommended_time: 권장 게시 시간 (예: 화요일 19:00 KST)\n\n"
        f"JSON 스키마로만 응답(다른 텍스트 금지): {_PUB_SCHEMA}"
    )

    raw, live = call_llm("Publishing Coordinator", prompt, json_mode=True)
    parsed = parse_json_safe(raw, {}) if live else {}

    platforms: dict = {}
    for ch in ["tiktok", "instagram_reels", "youtube_shorts"]:
        if ch in parsed and isinstance(parsed[ch], dict):
            platforms[ch] = parsed[ch]
        else:
            platforms[ch] = {
                "caption": "DATA_MISSING",
                "hashtags": [],
                "cta": "DATA_MISSING",
                "recommended_time": "DATA_MISSING",
            }

    # 일정표 — 오늘 기준 3일 후 첫 게시 (실제 날짜는 대표 확인)
    base = datetime.date.today()
    schedule = [
        {"date": str(base + datetime.timedelta(days=3)), "platform": "tiktok", "title": title},
        {"date": str(base + datetime.timedelta(days=4)), "platform": "instagram_reels", "title": title},
        {"date": str(base + datetime.timedelta(days=5)), "platform": "youtube_shorts", "title": title},
    ]

    return {
        "platforms": platforms,
        "schedule": schedule,
        "blocked_reason": None,
        "available": live,
        "brand": brand,
        "note": "⚠️ 게시는 대표 확인 후 진행. AI는 준비만 합니다.",
    }
