"""
publish_all.py — OSMU 산출물을 7개 플랫폼에 배포하는 오케스트레이터.
파이프라인: generate(output) → [CEO 승인] → 우선순위대로 publish → 통합 리포트.

CEO 승인 게이트:
  기본(--approve 없음) → 모든 Publisher '승인대기' (업로드 안 함).
  --approve            → 승인됨. 자격증명+DRY_RUN=false면 실업로드, 아니면 dry_run.

기존 구조 무변경 — src/의 기존 base_publisher/publishers에 연결만 한다.
"""
from __future__ import annotations
import sys
import json
import pathlib

from publishers import PUBLISHERS

OUT = pathlib.Path(__file__).resolve().parent.parent / "output"


def load_content() -> dict:
    """생성 단계 산출물(report.json)에서 배포용 메타 구성."""
    meta = {}
    rp = OUT / "report.json"
    if rp.exists():
        meta = json.loads(rp.read_text(encoding="utf-8"))
    yt = {}
    yp = OUT / "youtube.json"
    if yp.exists():
        yt = json.loads(yp.read_text(encoding="utf-8"))
    return {
        "title": yt.get("title") or meta.get("topic") or "무제",
        "image_url": meta.get("image_url", ""),   # 실제 이미지 URL은 assets 업로드 후 채움
        "video_url": meta.get("video_url", ""),
    }


def run(approved: bool) -> dict:
    content = load_content()
    results = []
    for cls in PUBLISHERS:
        results.append(cls().publish(content, approved=approved))
    report = {
        "approved": approved,
        "content_title": content["title"],
        "total": len(results),
        "by_status": {},
        "results": results,
    }
    for r in results:
        report["by_status"][r["status"]] = report["by_status"].get(r["status"], 0) + 1
    (OUT / "publish_report.json").write_text(
        json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    approved = "--approve" in sys.argv
    rep = run(approved)
    print(json.dumps({"approved": rep["approved"], "total": rep["total"],
                      "by_status": rep["by_status"]}, ensure_ascii=True, indent=2))
