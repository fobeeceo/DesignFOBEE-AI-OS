"""
Marketing Lead — 마케팅 파이프라인 오케스트레이터.

주제 1개 입력 → Role 1~7 순서 실행 → 12개 산출물 통합 → 대표 보고서 패키지 생성.
각 단계 실패해도 파이프라인 계속 (available:false로 표시, DATA_MISSING 기록).
실제 게시 없음 — 준비 패키지만 생성.

사용법:
  from marketing_lead import run
  result = run(brand="gbrick", topic="은평본점 공간 이야기")
  # result["report_markdown"] 을 브리핑에 포함
"""
from __future__ import annotations
import json
import pathlib
import datetime
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from trend_research import research as trend_research
from agents.marketing_audience import run as audience_run
from agents.marketing_channel import run as channel_run
from agents.marketing_planner import run as planner_run
from agents.marketing_video import run as video_run
from agents.marketing_brand_qa import run as brand_qa_run
from agents.marketing_publisher_prep import run as publisher_run
from marketing_llm import load_brand

OUT = ROOT / "output"


def _load_trend_sources(brand: str) -> list[dict]:
    cfg_path = ROOT / "config" / f"trend_sources_{brand}.json"
    if not cfg_path.exists():
        return []
    try:
        return json.loads(cfg_path.read_text(encoding="utf-8"))
    except Exception:
        return []


def _kpi_plan(brand: str, content_card: dict) -> dict:
    brand_cfg = load_brand(brand)
    kpi_primary = brand_cfg.get("kpi_primary", [])
    platform = content_card.get("platform", "tiktok")
    platform_kpi = {
        "tiktok": ["조회수", "좋아요", "저장", "팔로우", "공유"],
        "instagram_reels": ["도달수", "좋아요", "저장", "팔로우", "댓글"],
        "youtube_shorts": ["조회수", "시청 완료율", "좋아요", "구독"],
    }
    channel_metrics = platform_kpi.get(platform, ["조회수", "좋아요"])
    return {
        "primary_kpis": kpi_primary,
        "channel_metrics": channel_metrics,
        "measurement_window_days": 7,
        "next_experiment_hypothesis": f"{content_card.get('test_hypothesis', 'DATA_MISSING')}",
        "available": True,
    }


def _build_report(brand: str, topic: str, results: dict) -> str:
    brand_cfg = load_brand(brand)
    brand_name = brand_cfg.get("brand_name_ko", brand)
    today = datetime.date.today().isoformat()

    trend = results.get("trend", {})
    audience = results.get("audience", {})
    plan = results.get("plan", {})
    video = results.get("video", {})
    qa = results.get("brand_qa", {})
    pub = results.get("publishing", {})
    kpi = results.get("kpi", {})

    cards = plan.get("content_cards", [])
    rec_idx = plan.get("recommended_index", 0)
    rec_card = cards[rec_idx] if cards and rec_idx < len(cards) else {}

    lines = [
        f"# 마케팅 AI 브리핑 — {today} / {brand_name}",
        "",
        "## 📊 트렌드 요약",
    ]
    keywords = trend.get("키워드", [])
    lines.append(f"- 키워드: {', '.join(keywords) if keywords else 'DATA_MISSING'}")
    for opp in (trend.get("기회") or [])[:3]:
        lines.append(f"- 기회: {opp}")
    if not trend.get("available", False):
        lines.append("- ⚠️ 트렌드 조사 DATA_MISSING — GEMINI_API_KEY 또는 소스 접근 필요")

    lines += ["", "## 🎯 추천 콘텐츠 3개"]
    for card in cards[:3]:
        lines.append(f"{card.get('index', 0) + 1}. **{card.get('title', 'DATA_MISSING')}**")
        lines.append(f"   후킹: {card.get('hook_sentence', 'DATA_MISSING')}")
        lines.append(f"   근거: {card.get('basis', 'DATA_MISSING')} | 가설: {card.get('test_hypothesis', 'DATA_MISSING')}")

    lines += ["", "## ⭐ 최우선 콘텐츠"]
    lines.append(f"**{rec_card.get('title', 'DATA_MISSING')}**")
    lines.append(f"추천 이유: {plan.get('recommendation_reason', 'DATA_MISSING')}")

    lines += ["", "### 제목 후보"]
    for t in plan.get("title_candidates", []):
        lines.append(f"- {t}")

    lines += ["", "### 영상 대본"]
    lines.append(f"- 후킹 (첫 3초): {video.get('hook', 'DATA_MISSING')}")
    lines.append(f"- 총 길이: {video.get('duration_sec', 'DATA_MISSING')}초")
    for scene in (video.get("scenes") or []):
        lines.append(
            f"- 장면 {scene.get('number', '?')} ({scene.get('duration_sec', '?')}초): "
            f"{scene.get('visual', '')} / 나레이션: {scene.get('narration', '')} / 자막: {scene.get('subtitle', '')}"
        )
        if scene.get("shoot_instruction"):
            lines.append(f"  촬영: {scene['shoot_instruction']}")

    if video.get("capcut_instructions"):
        lines += ["", "### CapCut 편집 지시"]
        for inst in video["capcut_instructions"]:
            lines.append(f"- {inst}")

    if video.get("required_assets"):
        lines += ["", "### 필요 자료"]
        for asset in video["required_assets"]:
            lines.append(f"- {asset}")

    lines += ["", "## 📱 플랫폼별 게시 준비"]
    if pub.get("blocked_reason"):
        lines.append(f"⛔ 게시 준비 중단: {pub['blocked_reason']}")
    else:
        for ch, data in (pub.get("platforms") or {}).items():
            lines.append(f"**{ch}**")
            lines.append(f"- 문구: {data.get('caption', 'DATA_MISSING')}")
            lines.append(f"- 해시태그: {', '.join('#' + h for h in (data.get('hashtags') or []))}")
            lines.append(f"- CTA: {data.get('cta', 'DATA_MISSING')}")
            lines.append(f"- 권장 시간: {data.get('recommended_time', 'DATA_MISSING')}")
        if pub.get("schedule"):
            lines += ["", "### 일정표"]
            for item in pub["schedule"]:
                lines.append(f"- {item['date']} | {item['platform']} | {item['title']}")

    lines += ["", "## ✅ Brand QA 결과"]
    lines.append(f"- 통과: {'✅ 통과' if qa.get('passed') else '❌ 미통과'}")
    if qa.get("violations"):
        for v in qa["violations"]:
            lines.append(f"  - 위반: {v}")
    if qa.get("suggestions"):
        for s in qa["suggestions"]:
            lines.append(f"  - 수정: {s}")

    lines += ["", "## 📈 게시 후 측정 KPI"]
    lines.append(f"- 주요 KPI: {', '.join(kpi.get('primary_kpis', []))}")
    lines.append(f"- 채널 지표: {', '.join(kpi.get('channel_metrics', []))}")
    lines.append(f"- 측정 기간: {kpi.get('measurement_window_days', 7)}일")
    lines.append(f"- 다음 실험 가설: {kpi.get('next_experiment_hypothesis', 'DATA_MISSING')}")

    lines += [
        "",
        "---",
        "⚠️ 게시는 대표 확인 후 진행합니다. AI는 준비만 합니다.",
    ]
    return "\n".join(lines)


def run(brand: str, topic: str) -> dict:
    """
    마케팅 패키지 완성 생성.
    반환: {brand, topic, generated_at, trend, audience, channel_strategy,
           plan, video, brand_qa, publishing, kpi, report_markdown,
           all_available: bool}
    """
    generated_at = datetime.datetime.now(tz=datetime.timezone.utc).isoformat()

    # 1. Trend Research (기존 모듈 재사용)
    sources = _load_trend_sources(brand)
    trend = trend_research(sources, brand=brand) if sources else {
        "available": False, "reason": "소스 설정 파일 없음", "키워드": [], "기회": []
    }

    # 2. Audience Analysis
    audience = audience_run(brand, trend)

    # 3. Channel Strategy
    channel_strategy = channel_run(brand, audience, trend)

    # 4. Content Planning
    plan = planner_run(brand, topic, trend, audience, channel_strategy)

    # 5. Video Production (최우선 카드 사용)
    cards = plan.get("content_cards", [])
    rec_idx = plan.get("recommended_index", 0)
    rec_card = cards[rec_idx] if cards and rec_idx < len(cards) else {
        "title": topic, "hook_sentence": "", "structure": [], "cta": "", "platform": "tiktok"
    }
    video = video_run(brand, rec_card, channel_strategy)

    # 6. Brand QA (영상 대본 + 플래너 출력 합산)
    combined_text = video.get("full_script", "") + " " + rec_card.get("title", "")
    brand_qa = brand_qa_run(brand, combined_text, check_type="script")

    # 법정고지 자동 추가 — requires_legal_notice=True이면 full_script 끝에 삽입 후 QA 재실행
    if brand_qa.get("requires_legal_notice") and not brand_qa.get("passed"):
        brand_cfg_tmp = load_brand(brand)
        legal_notice = brand_cfg_tmp.get("legal_notice", "")
        if legal_notice and "정보공개서 기준" not in video.get("full_script", ""):
            video["full_script"] = video.get("full_script", "") + f"\n\n{legal_notice}"
            combined_text = video["full_script"] + " " + rec_card.get("title", "")
            brand_qa = brand_qa_run(brand, combined_text, check_type="script")

    # 7. Publishing Prep
    publishing = publisher_run(brand, video, channel_strategy, rec_card, brand_qa)

    # 8. KPI Plan
    kpi = _kpi_plan(brand, rec_card)

    results = {
        "trend": trend, "audience": audience, "channel_strategy": channel_strategy,
        "plan": plan, "video": video, "brand_qa": brand_qa,
        "publishing": publishing, "kpi": kpi,
    }

    report_md = _build_report(brand, topic, results)

    # 출력 파일 저장
    out_dir = OUT / brand
    out_dir.mkdir(parents=True, exist_ok=True)
    pkg_path = out_dir / "marketing_package.json"
    report_path = out_dir / "marketing_brief.md"
    pkg_path.write_text(
        json.dumps({**results, "brand": brand, "topic": topic, "generated_at": generated_at},
                   ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    report_path.write_text(report_md, encoding="utf-8")

    all_available = all([
        trend.get("available", False),
        audience.get("available", False),
        plan.get("available", False),
        video.get("available", False),
    ])

    return {
        **results,
        "brand": brand,
        "topic": topic,
        "generated_at": generated_at,
        "report_markdown": report_md,
        "output_files": {
            "package": str(pkg_path),
            "brief": str(report_path),
        },
        "all_available": all_available,
    }


if __name__ == "__main__":
    import sys as _sys
    brand_arg = _sys.argv[1] if len(_sys.argv) > 1 else "gbrick"
    topic_arg = _sys.argv[2] if len(_sys.argv) > 2 else "은평본점 공간 이야기"
    result = run(brand=brand_arg, topic=topic_arg)
    print(result["report_markdown"])
    print(f"\n--- all_available: {result['all_available']} ---")
