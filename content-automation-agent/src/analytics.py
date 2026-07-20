"""
analytics.py — 성과 환류(Living Document Feedback Loop) MVP 골격.
업로드 후 지표 수집 → AI 분석 → Living Document(Change Report)로 개선 제안 환류.
실제 지표 API/Notion 키는 .env에서. 키 없으면 dry-run으로 제안 payload만 생성.
"""
from __future__ import annotations
import os
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output"

METRICS = ["views", "ctr", "likes", "comments", "watch_time_sec", "subscribers"]


def collect(platform: str, content_id: str) -> dict:
    """플랫폼 지표 수집 (실제 API는 자격증명 후). dry-run은 0으로."""
    if os.environ.get("META_GRAPH_ACCESS_TOKEN") or os.environ.get("YOUTUBE_REFRESH_TOKEN"):
        pass  # TODO: 실제 지표 API 호출
    return {m: 0 for m in METRICS} | {"platform": platform, "content_id": content_id, "dry_run": True}


def analyze_and_propose(metrics: dict) -> dict:
    """
    지표 → 개선안 → Living Document Change Report 제안(엔티티=콘텐츠, 상태=제안).
    CEO 승인 후에만 Master DB/Prompt 반영 (기존 승인 게이트 준수).
    """
    proposal = {
        "target": "Living Document — Change Report",
        "entity": "콘텐츠",
        "action": "UPDATE",
        "field": f"{metrics['platform']} 콘텐츠 성과 기반 프롬프트 개선",
        "new_value": _improvement(metrics),
        "source": f"analytics::{metrics['platform']}::{metrics.get('content_id')}",
        "status": "제안",  # 자동 반영 금지
    }
    (OUT / "report.json").write_text(json.dumps(proposal, ensure_ascii=False, indent=2), encoding="utf-8")
    # TODO: NOTION_API_KEY 있으면 Change Report DB에 실제 페이지 생성
    return proposal


def _improvement(m: dict) -> str:
    if m.get("ctr", 0) and m["ctr"] < 0.03:
        return "CTR 낮음 → 썸네일/후크 강화 프롬프트 조정 제안"
    if m.get("watch_time_sec", 0) and m["watch_time_sec"] < 15:
        return "체류시간 낮음 → 오프닝 3초 재구성 제안"
    return "성과 양호 → 현 프롬프트 유지, 유사 주제 확장 추천"


if __name__ == "__main__":
    print(json.dumps(analyze_and_propose(collect("youtube", "demo123")), ensure_ascii=True, indent=2))
