"""
analytics.py — 성과 환류(Living Document Feedback Loop) MVP 골격.
업로드 후 지표 수집 → AI 분석 → Living Document(Change Report)로 개선 제안 환류.
실제 지표 API 키는 .env에서(META_GRAPH_ACCESS_TOKEN·YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN).
키 없으면 dry-run, 있으면 실제 API 호출(INSTALL.md §6 발급 절차 — CEO 전용 수동 가입 필요).
⚠️ 2026-07-23 기준: 코드는 공식 문서대로 구현했으나 실토큰으로 검증되지 않음(자격증명 미발급).
   자격증명 도착 즉시 실행해 재검증하기 전까지 "정규직" 승격 대상 아님(AI-STAFF-POLICY §2).
"""
from __future__ import annotations
import os
import json
import pathlib
import urllib.request
import urllib.parse
import urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output"

METRICS = ["views", "ctr", "likes", "comments", "watch_time_sec", "subscribers"]
META_METRIC_MAP = {"views": "impressions", "likes": "likes", "comments": "comments"}


def _http_json(url: str, headers: dict | None = None, timeout: int = 10) -> dict:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def _fetch_meta_insights(content_id: str, access_token: str) -> dict:
    """Instagram/Facebook/Threads 게시물 인사이트 (Meta Graph API v19.0).
    content_id = Media ID(게시물 자체 ID, URL이 아님). 문서: developers.facebook.com/docs/instagram-api/guides/insights"""
    metrics = ",".join(META_METRIC_MAP.values())
    url = f"https://graph.facebook.com/v19.0/{content_id}/insights?metric={metrics}&access_token={urllib.parse.quote(access_token)}"
    try:
        data = _http_json(url)
        raw = {item.get("name"): item.get("values", [{}])[-1].get("value", 0) for item in data.get("data", [])}
        return {k: raw.get(v, 0) for k, v in META_METRIC_MAP.items()}
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, json.JSONDecodeError) as e:
        return {"_error": str(e)}


def _youtube_access_token() -> str | None:
    """YOUTUBE_REFRESH_TOKEN → access token 교환 (OAuth 2.0 표준 리프레시 플로우)."""
    client_id = os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET")
    refresh_token = os.environ.get("YOUTUBE_REFRESH_TOKEN")
    if not (client_id and client_secret and refresh_token):
        return None
    data = urllib.parse.urlencode({
        "client_id": client_id, "client_secret": client_secret,
        "refresh_token": refresh_token, "grant_type": "refresh_token",
    }).encode()
    try:
        req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
        with urllib.request.urlopen(req, timeout=10) as res:
            return json.loads(res.read().decode("utf-8")).get("access_token")
    except (urllib.error.URLError, urllib.error.HTTPError):
        return None


def _fetch_youtube_stats(video_id: str, access_token: str) -> dict:
    """YouTube 동영상 통계 (YouTube Data API v3 videos.list). 문서: developers.google.com/youtube/v3/docs/videos/list"""
    url = f"https://www.googleapis.com/youtube/v3/videos?part=statistics&id={video_id}"
    try:
        data = _http_json(url, headers={"Authorization": f"Bearer {access_token}"})
        items = data.get("items", [])
        if not items:
            return {"_error": "동영상을 찾을 수 없음(video_id 확인 필요)"}
        s = items[0].get("statistics", {})
        return {"views": int(s.get("viewCount", 0)), "likes": int(s.get("likeCount", 0)),
                "comments": int(s.get("commentCount", 0))}
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, json.JSONDecodeError) as e:
        return {"_error": str(e)}


def collect(platform: str, content_id: str) -> dict:
    """플랫폼 지표 자동 수집. 자격증명 있으면 실제 API 호출, 없으면 dry-run.
    실패 시(자격증명 오류·잘못된 content_id 등) 원인을 error에 담아 정직하게 반환(추측 금지)."""
    if platform in ("instagram", "facebook", "threads"):
        token = os.environ.get("META_GRAPH_ACCESS_TOKEN")
        if token:
            raw = _fetch_meta_insights(content_id, token)
            if "_error" not in raw:
                return {m: raw.get(m, 0) for m in METRICS} | {
                    "platform": platform, "content_id": content_id, "dry_run": False, "source": "meta_api"}
            return {m: 0 for m in METRICS} | {
                "platform": platform, "content_id": content_id, "dry_run": True,
                "source": "meta_api_error", "error": raw["_error"]}
    if platform == "youtube":
        access_token = _youtube_access_token()
        if access_token:
            raw = _fetch_youtube_stats(content_id, access_token)
            if "_error" not in raw:
                return {m: raw.get(m, 0) for m in METRICS} | {
                    "platform": platform, "content_id": content_id, "dry_run": False, "source": "youtube_api"}
            return {m: 0 for m in METRICS} | {
                "platform": platform, "content_id": content_id, "dry_run": True,
                "source": "youtube_api_error", "error": raw["_error"]}
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
