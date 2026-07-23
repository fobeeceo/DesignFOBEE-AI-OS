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
    """플랫폼 지표 자동 수집. Meta/YouTube API 자격증명(외부 서비스 가입, CEO 승인 대상)이 없으면
    dry-run으로 0 반환 — 진짜 지표를 확인하려면 collect_manual()을 쓴다."""
    if os.environ.get("META_GRAPH_ACCESS_TOKEN") or os.environ.get("YOUTUBE_REFRESH_TOKEN"):
        pass  # TODO: 실제 지표 API 호출(자격증명 발급 후 연결)
    return {m: 0 for m in METRICS} | {"platform": platform, "content_id": content_id, "dry_run": True, "source": "auto"}


def collect_manual(platform: str, content_id: str, metrics: dict) -> dict:
    """수동 입력 지표 — Meta/YouTube API 가입 없이, 사람이 직접 확인한 실측치를 입력해 분석한다.
    METRICS 중 모르는 항목은 생략(0으로 지어내지 않음, missing에 기록)."""
    clean = {k: v for k, v in metrics.items() if k in METRICS}
    missing = [m for m in METRICS if m not in clean]
    return {**clean, "platform": platform, "content_id": content_id, "dry_run": False,
            "source": "manual", "missing": missing}


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
    missing = m.get("missing", [])
    if "ctr" not in missing and m.get("ctr", 0) and m["ctr"] < 0.03:
        return "CTR 낮음 → 썸네일/후크 강화 프롬프트 조정 제안"
    if "watch_time_sec" not in missing and m.get("watch_time_sec", 0) and m["watch_time_sec"] < 15:
        return "체류시간 낮음 → 오프닝 3초 재구성 제안"
    if missing:
        return f"측정 지표 일부 미입력({', '.join(missing)}) — 채워주면 더 정확한 제안 가능"
    return "성과 양호 → 현 프롬프트 유지, 유사 주제 확장 추천"


if __name__ == "__main__":
    # 코드 동작 테스트용 예시 값(실측 아님) — 실 검증은 사람이 실제 게시물 지표를 확인해 collect_manual()에 입력해야 한다.
    print("[코드경로 테스트, 실데이터 아님]")
    print(json.dumps(analyze_and_propose(
        collect_manual("instagram", "TEST_예시게시물", {"views": 500, "likes": 20, "ctr": 0.02})
    ), ensure_ascii=True, indent=2))
