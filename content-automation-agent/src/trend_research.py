"""
trend_research.py — AI Trend Researcher.
SOP(Notion AI Media Workforce): 키워드 수집 → 경쟁 콘텐츠 분석 → 기회 도출 → Director 전달.
공개 소스(블로그/뉴스/백과 등)를 fetch해 Gemini로 분석하고, generate_osmu.generate()가 바로 쓸 수
있는 source dict(topic/keywords/brand)를 산출한다. GEMINI_API_KEY 없거나 소스 접근 실패 시
available:false로 정직하게 반환(추측 금지, 무파괴).
"""
from __future__ import annotations
import os
import re
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)

MODEL = "gemini-flash-latest"
MAX_CHARS = 6000


def _fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DesignFOBEE-AI-HQ-Research/1.0)"})
    with urllib.request.urlopen(req, timeout=15) as res:
        html = res.read().decode("utf-8", errors="ignore")
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:MAX_CHARS]


def research(sources: list[dict], brand: str = "gbrick") -> dict:
    """
    sources = [{"name": str, "url": str}, ...] — 실제 공개 소스.
    반환: {분석대상, 접근실패, 키워드, 경쟁콘텐츠요약, 기회, 추천소스:{topic,keywords,brand}, available}
    """
    fetched, failed = [], []
    for s in sources:
        try:
            text = _fetch_text(s["url"])
            (fetched if len(text) > 100 else failed).append(
                {**s, "text": text} if len(text) > 100 else {**s, "error": "본문 텍스트가 너무 짧음"}
            )
        except Exception as e:
            failed.append({**s, "error": str(e)})

    result: dict = {"분석대상": len(fetched), "접근실패": failed}

    api_key = os.environ.get("GEMINI_API_KEY")
    if not fetched:
        result.update(available=False, reason="접근 가능한 소스가 없음")
        (OUT / "trend_research.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        return result
    if not api_key:
        result.update(available=False, reason="GEMINI_API_KEY 없음")
        (OUT / "trend_research.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        return result

    joined = "\n\n".join(f"--- {f['name']} ({f['url']}) ---\n{f['text']}" for f in fetched)
    brand_kr = "GBRICK 커피" if brand == "gbrick" else "DesignFOBEE 인테리어"
    prompt = (
        f"당신은 {brand_kr} 브랜드의 콘텐츠 트렌드 리서처다. 아래 공개 소스 텍스트를 근거로만(추측 금지): "
        f"1)반복 등장하는 키워드 5~8개 2)소스가 다루는 주제 요약 3~5개 3)우리 브랜드가 아직 다루지 않았을 법한 "
        f"콘텐츠 기회 3개를 뽑아라. 마지막으로 기회 중 가장 유망한 것 하나를 블로그 주제로 골라 topic과 keywords를 제안하라.\n\n"
        f'JSON 스키마로만 응답(다른 텍스트 금지): {{"키워드":[""],"경쟁콘텐츠요약":[""],"기회":[""],'
        f'"추천소스":{{"topic":"","keywords":[""]}}}}\n\n[소스]\n{joined}'
    )
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        res = client.models.generate_content(
            model=MODEL, contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        text = (res.text or "").strip()
        parsed = json.loads(text)
        result.update(parsed)
        result["available"] = True
        if isinstance(parsed.get("추천소스"), dict):
            parsed["추천소스"]["brand"] = brand
    except Exception as e:
        result.update(available=False, reason=f"분석 실패: {e}")

    (OUT / "trend_research.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


if __name__ == "__main__":
    # 데모 실행: 실제 공개 백과 소스(카페 산업 일반) — 실서비스에서는 CEO가 지정한 트렌드 소스로 교체.
    demo_sources = [
        {"name": "위키백과 — 커피전문점", "url": "https://ko.wikipedia.org/wiki/%EC%BB%A4%ED%94%BC%EC%A0%84%EB%AC%B8%EC%A0%90"},
        {"name": "위키백과 — 카페", "url": "https://ko.wikipedia.org/wiki/%EC%B9%B4%ED%8E%98"},
    ]
    print(json.dumps(research(demo_sources, brand="gbrick"), ensure_ascii=True, indent=2))
