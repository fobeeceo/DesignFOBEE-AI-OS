"""
generate_osmu.py — One Source Multi Use 콘텐츠 생성기 (MVP 골격).
하나의 소스 → /output 의 다중 산출물(blog/shorts/instagram/youtube ...).

LLM 호출부는 _llm()에 격리. 키가 없으면 dry-run(템플릿 스텁)으로 산출물 구조를 생성해
파이프라인 전체가 키 없이도 테스트되도록 한다. (기존 OS 무파괴)
"""
from __future__ import annotations
import os
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)

# OSMU 산출물 정의 (지시서 /output 스펙)
ARTIFACTS = [
    "blog.md", "blogger.md", "naver.md",
    "youtube.json", "shorts.json",
    "instagram.txt", "facebook.txt", "threads.txt", "x.txt",
    "report.json",
]


def _llm(role: str, prompt: str) -> str:
    """LLM 호출 격리부. 키 있으면 실제 호출(추후), 없으면 dry-run 스텁."""
    if os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY"):
        # TODO: 실제 LLM 호출 연결 (Prompt Library의 role 프롬프트 사용)
        pass
    return f"[DRY-RUN::{role}] {prompt[:80]}"


def generate(source: dict) -> dict:
    """
    source = {"topic": str, "keywords": [str], "brand": "designfobee"|"gbrick"}
    반환: 생성된 산출물 경로 맵.
    """
    topic = source.get("topic", "무제")
    brand = source.get("brand", "designfobee")
    kw = ", ".join(source.get("keywords", []))
    made: dict[str, str] = {}

    # 1) 블로그 (SEO 본문) — Blog Writer
    blog = f"# {topic}\n\n> 브랜드: {brand} · 키워드: {kw}\n\n{_llm('AI Blog Writer', topic)}\n"
    (OUT / "blog.md").write_text(blog, encoding="utf-8")
    (OUT / "blogger.md").write_text(blog, encoding="utf-8")
    (OUT / "naver.md").write_text(blog, encoding="utf-8")
    made["blog"] = "blog.md/blogger.md/naver.md"

    # 2) 쇼츠/유튜브 스크립트 — Shorts Producer
    shorts = {"topic": topic, "hook": _llm("AI Shorts Producer", topic),
              "scenes": [], "duration_sec": 30, "brand": brand}
    (OUT / "shorts.json").write_text(json.dumps(shorts, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "youtube.json").write_text(json.dumps(
        {"title": topic, "description": blog[:200], "tags": source.get("keywords", []),
         "visibility": os.environ.get("DEFAULT_VISIBILITY", "private")},
        ensure_ascii=False, indent=2), encoding="utf-8")
    made["video"] = "shorts.json/youtube.json"

    # 3) SNS 캡션 (OSMU) — Instagram/FB/Threads/X
    caption = _llm("AI Instagram Manager", topic)
    for f in ["instagram.txt", "facebook.txt", "threads.txt", "x.txt"]:
        (OUT / f).write_text(caption + f"\n#{brand} #{topic}", encoding="utf-8")
    made["sns"] = "instagram/facebook/threads/x .txt"

    # 4) 리포트 (파이프라인 메타)
    report = {"topic": topic, "brand": brand, "artifacts": ARTIFACTS,
              "dry_run": not (os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY"))}
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    made["report"] = "report.json"
    return made


if __name__ == "__main__":
    demo = {"topic": "26년 공간디자인이 만든 GBRICK 카페", "brand": "gbrick",
            "keywords": ["카페 인테리어", "공간디자인", "GBRICK"]}
    print(json.dumps(generate(demo), ensure_ascii=True, indent=2))
