"""
generate_osmu.py — One Source Multi Use 콘텐츠 생성기.
하나의 소스 → /output 의 다중 산출물(blog/shorts/instagram/youtube ...).

LLM 호출부는 _llm()에 격리. GEMINI_API_KEY 있으면 실제 Gemini 호출(브랜드 스타일가이드 SSOT 반영),
없거나 호출 실패 시 dry-run 스텁으로 안전 폴백해 파이프라인 전체가 항상 끝까지 실행되게 한다. (기존 OS 무파괴)
"""
from __future__ import annotations
import os
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
GUIDES = ROOT / "guides"

# OSMU 산출물 정의 (지시서 /output 스펙)
ARTIFACTS = [
    "blog.md", "blogger.md", "naver.md",
    "youtube.json", "shorts.json",
    "instagram.txt", "facebook.txt", "threads.txt", "x.txt",
    "report.json",
]

MODEL = "gemini-flash-latest"


def _style_guide(brand: str) -> str:
    """브랜드 스타일 가이드(SSOT) 로드. 없으면 빈 문자열(추측 금지, LLM에 지시 없이 넘기지 않음)."""
    name = "gbrick-style.md" if brand == "gbrick" else "designpobee-style.md"
    p = GUIDES / name
    return p.read_text(encoding="utf-8") if p.exists() else ""


def _llm(role: str, prompt: str) -> tuple[str, bool]:
    """LLM 호출 격리부. GEMINI_API_KEY 있으면 실제 호출, 없거나 실패하면 dry-run 스텁으로 폴백.
    반환: (텍스트, live 여부)."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return f"[DRY-RUN::{role}] {prompt[:80]}", False
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        res = client.models.generate_content(model=MODEL, contents=prompt)
        text = (res.text or "").strip()
        if not text:
            return f"[DRY-RUN::{role}] {prompt[:80]}", False
        return text, True
    except Exception as e:
        return f"[DRY-RUN::{role}::ERROR {e}] {prompt[:80]}", False


def generate(source: dict) -> dict:
    """
    source = {"topic": str, "keywords": [str], "brand": "designfobee"|"gbrick"}
    반환: 생성된 산출물 경로 맵.
    """
    topic = source.get("topic", "무제")
    brand = source.get("brand", "designfobee")
    kw = ", ".join(source.get("keywords", []))
    guide = _style_guide(brand)
    made: dict[str, str] = {}
    live_flags: dict[str, bool] = {}

    # 1) 블로그 (SEO 본문) — AI Blog Writer (SOP: 기획서→본문초안→SEO검증→blog.md)
    blog_prompt = (
        f"아래 브랜드 스타일 가이드를 반드시 지켜서, 주제 '{topic}'(키워드: {kw})에 대한 "
        f"SEO 블로그 본문을 한국어로 400자 내외로 작성하라. 가이드에 없는 수치나 사실을 지어내지 마라. "
        f"본문만 출력하고 제목·머리말은 붙이지 마라.\n\n[브랜드 스타일 가이드]\n{guide}"
    )
    body, blog_live = _llm("AI Blog Writer", blog_prompt)
    blog = f"# {topic}\n\n> 브랜드: {brand} · 키워드: {kw}\n\n{body}\n"
    (OUT / "blog.md").write_text(blog, encoding="utf-8")
    (OUT / "blogger.md").write_text(blog, encoding="utf-8")
    (OUT / "naver.md").write_text(blog, encoding="utf-8")
    made["blog"] = "blog.md/blogger.md/naver.md"
    live_flags["blog"] = blog_live

    # 2) 쇼츠/유튜브 스크립트 — AI Shorts Producer (SOP: 본문→후크3초→씬분할→shorts.json)
    shorts_prompt = (
        "위 블로그 본문을 30초 쇼츠 영상 대본으로 재구성하라. 첫 3초 후크 한 문장 + 장면(scene) 3~4개를 "
        '아래 JSON 스키마로만 출력하라(다른 텍스트·마크다운 금지): '
        '{"hook":"...","scenes":["...","..."]}\n\n'
        f"[본문]\n{body}"
    )
    shorts_raw, shorts_live = _llm("AI Shorts Producer", shorts_prompt)
    hook, scenes = shorts_raw, []
    if shorts_live:
        try:
            parsed = json.loads(shorts_raw)
            hook, scenes = parsed.get("hook", shorts_raw), parsed.get("scenes", [])
        except (json.JSONDecodeError, AttributeError):
            shorts_live = False
    (OUT / "shorts.json").write_text(json.dumps(
        {"topic": topic, "hook": hook, "scenes": scenes, "duration_sec": 30, "brand": brand},
        ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "youtube.json").write_text(json.dumps(
        {"title": topic, "description": blog[:200], "tags": source.get("keywords", []),
         "visibility": os.environ.get("DEFAULT_VISIBILITY", "private")},
        ensure_ascii=False, indent=2), encoding="utf-8")
    made["video"] = "shorts.json/youtube.json"
    live_flags["shorts"] = shorts_live

    # 3) SNS 캡션 (OSMU) — _llm() 재사용, Instagram Manager 등 발행 인력은 여전히 대기(발행 인프라 없음)
    caption_prompt = f"위 블로그 본문을 인스타그램 캡션(2~3문장, 이모지 최소한)으로 요약하라.\n\n[본문]\n{body}"
    caption, caption_live = _llm("AI Instagram Manager", caption_prompt)
    for f in ["instagram.txt", "facebook.txt", "threads.txt", "x.txt"]:
        (OUT / f).write_text(caption + f"\n#{brand} #{topic}", encoding="utf-8")
    made["sns"] = "instagram/facebook/threads/x .txt"
    live_flags["sns"] = caption_live

    # 4) 리포트 (파이프라인 메타)
    report = {"topic": topic, "brand": brand, "artifacts": ARTIFACTS,
              "live": live_flags, "dry_run": not any(live_flags.values())}
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    made["report"] = "report.json"
    return made


if __name__ == "__main__":
    demo = {"topic": "13년째, 은평에서 — GBRICK Coffee 은평본점", "brand": "gbrick",
            "keywords": ["카페 인테리어", "공간디자인", "GBRICK", "은평본점"]}
    print(json.dumps(generate(demo), ensure_ascii=True, indent=2))
