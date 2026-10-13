"""
Video Producer — 15~20초 숏폼 영상 대본·장면·편집 지시 에이전트.

Input:  brand: str, content_card: dict (Content Planner 최우선 카드),
        channel_strategy: dict
Process: 기획 카드 → Gemini로 대본+장면 분할+자막+CapCut 지시+필요 자료 목록 생성.
         생성 후 Brand QA 호출 — QA 실패 시 passed=False로 표시(파이프라인은 계속).
Output: {full_script, duration_sec, hook, scenes:[{number,duration_sec,visual,
         narration,subtitle,shoot_instruction}], capcut_instructions, required_assets,
         brand_qa_inline, available}
"""
from __future__ import annotations
import sys
import pathlib
import json

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from marketing_llm import call_llm, parse_json_safe, load_brand
from agents.marketing_brand_qa import run as brand_qa

_SCENE_SCHEMA = json.dumps({
    "full_script": "",
    "duration_sec": 18,
    "hook": "",
    "scenes": [
        {
            "number": 1,
            "duration_sec": 5,
            "visual": "",
            "narration": "",
            "subtitle": "",
            "shoot_instruction": ""
        }
    ],
    "capcut_instructions": [""],
    "required_assets": [""]
})


def run(brand: str, content_card: dict, channel_strategy: dict) -> dict:
    brand_cfg = load_brand(brand)
    brand_name = brand_cfg.get("brand_name_ko", brand)
    facts = "\n".join(f"- {f}" for f in brand_cfg.get("ssot_facts", []))
    prohibited = ", ".join(brand_cfg.get("prohibited_claims", []))

    title = content_card.get("title", "무제")
    hook = content_card.get("hook_sentence", "")
    structure = content_card.get("structure", [])
    cta = content_card.get("cta", "")
    platform = content_card.get("platform", "tiktok")

    ch_info = channel_strategy.get("channels", {}).get(platform, {})
    duration_target = ch_info.get("duration_sec", 18) or 18

    prompt = (
        f"당신은 {brand_name} 브랜드의 숏폼 영상 제작자다. 아래 기획 카드로 {duration_target}초 영상 대본을 작성하라.\n\n"
        f"[제목] {title}\n"
        f"[후킹] {hook}\n"
        f"[구성] {', '.join(structure)}\n"
        f"[CTA] {cta}\n"
        f"[플랫폼] {platform}\n"
        f"[SSOT 팩트 — 이것만 인용]\n{facts if facts else 'DATA_MISSING'}\n"
        f"[금지 수치/표현] {prohibited if prohibited else '없음'}\n\n"
        f"포함 항목:\n"
        f"- full_script: 전체 대본 (나레이션 포함)\n"
        f"- duration_sec: 총 길이(초)\n"
        f"- hook: 첫 3초 후킹 문장\n"
        f"- scenes: 장면 3~4개, 각각 number/duration_sec/visual(화면 내용)/narration(나레이션)/subtitle(자막)/shoot_instruction(촬영 지시)\n"
        f"- capcut_instructions: CapCut 편집 지시 목록 (전환효과·자막스타일·음악 등)\n"
        f"- required_assets: 필요한 사진·영상 자료 목록\n\n"
        f"JSON 스키마로만 응답(다른 텍스트 금지): {_SCENE_SCHEMA}"
    )

    raw, live = call_llm("Video Producer", prompt, json_mode=True)
    parsed = parse_json_safe(raw, {}) if live else {}

    full_script = parsed.get("full_script", f"[DRY-RUN] {title} 대본 — GEMINI_API_KEY 없음")
    scenes = parsed.get("scenes", [
        {"number": 1, "duration_sec": duration_target, "visual": "DATA_MISSING",
         "narration": "DATA_MISSING", "subtitle": "DATA_MISSING", "shoot_instruction": "DATA_MISSING"}
    ])
    capcut = parsed.get("capcut_instructions", ["DATA_MISSING"])
    assets = parsed.get("required_assets", ["DATA_MISSING"])

    # 인라인 Brand QA — 실패해도 파이프라인 계속
    qa_result = brand_qa(brand, full_script, check_type="script")

    return {
        "full_script": full_script,
        "duration_sec": parsed.get("duration_sec", duration_target),
        "hook": parsed.get("hook", hook),
        "scenes": scenes,
        "capcut_instructions": capcut,
        "required_assets": assets,
        "brand_qa_inline": qa_result,
        "available": live,
        "brand": brand,
        "title": title,
    }
