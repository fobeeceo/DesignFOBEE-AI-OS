"""
marketing_llm.py — 마케팅 파이프라인 공통 LLM 헬퍼.

generate_osmu.py의 _llm() 패턴을 분리해 여러 에이전트가 중복 없이 공유한다.
GEMINI_API_KEY 없거나 호출 실패 시 dry-run 스텁으로 안전 폴백(파이프라인 무파괴).
"""
from __future__ import annotations
import os
import json

MODEL = "gemini-flash-latest"


def call_llm(role: str, prompt: str, json_mode: bool = False) -> tuple[str, bool]:
    """Gemini 호출 격리부. 반환: (텍스트, live 여부).
    live=False면 dry-run 스텁이므로 호출자가 available:false로 표시해야 한다."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return f"[DRY-RUN::{role}] GEMINI_API_KEY 없음", False
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        config = None
        if json_mode:
            from google.genai import types
            config = types.GenerateContentConfig(response_mime_type="application/json")
        res = client.models.generate_content(model=MODEL, contents=prompt, config=config)
        text = (res.text or "").strip()
        if not text:
            return f"[DRY-RUN::{role}] 빈 응답", False
        return text, True
    except Exception as e:
        return f"[DRY-RUN::{role}::ERR {e}]", False


def parse_json_safe(text: str, fallback: dict | list) -> dict | list:
    """JSON 파싱. 실패하면 fallback 반환 (파이프라인 중단 없음)."""
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return fallback


def load_brand(brand: str) -> dict:
    """브랜드 설정 JSON 로드. 없으면 최소 stub 반환."""
    import pathlib
    config_dir = pathlib.Path(__file__).resolve().parent.parent / "config"
    path = config_dir / f"brand_{brand}.json"
    if not path.exists():
        return {"brand_id": brand, "prohibited_patterns_regex": [], "prohibited_claims": [],
                "ssot_facts": [], "legal_notice": None, "legal_notice_required_when": [],
                "kpi_primary": [], "channel_priority": []}
    return json.loads(path.read_text(encoding="utf-8"))
