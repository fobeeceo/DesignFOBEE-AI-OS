"""
BasePublisher — 모든 플랫폼 퍼블리셔의 공통 골격.
가드레일: (1) API Key는 .env에서만 (2) 기본 Private/dry-run
(3) CEO 승인 게이트 (4) 실패 시 logs/ 저장 (5) 성공 시 output/ 리포트 생성.
기존 OS 무파괴 — 이 모듈은 자기 워크스페이스에서만 동작.
"""
from __future__ import annotations
import os
import json
import datetime
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG_DIR = ROOT / "logs"
OUT_DIR = ROOT / "output"
LOG_DIR.mkdir(exist_ok=True)
OUT_DIR.mkdir(exist_ok=True)


def env(key: str, default: str | None = None) -> str | None:
    """환경변수만 읽는다. 코드에 키를 직접 쓰지 않는다."""
    return os.environ.get(key, default)


def _log(platform: str, level: str, payload: dict) -> None:
    line = {
        "ts": datetime.datetime.now().isoformat(timespec="seconds"),
        "platform": platform,
        "level": level,
        **payload,
    }
    with open(LOG_DIR / f"{platform}.log", "a", encoding="utf-8") as f:
        f.write(json.dumps(line, ensure_ascii=False) + "\n")


def _write_report(platform: str, result: dict) -> None:
    """성공/결과 리포트 생성."""
    path = OUT_DIR / f"report_{platform}.json"
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")


class BasePublisher:
    platform = "base"

    def __init__(self) -> None:
        self.dry_run = env("DRY_RUN", "true").lower() != "false"
        self.visibility = env("DEFAULT_VISIBILITY", "private")

    def _credentials(self) -> dict:
        """서브클래스가 override — .env 키만 반환."""
        return {}

    def _do_publish(self, content: dict, creds: dict) -> dict:
        """서브클래스가 실제 API 호출 구현. (자격증명 확보 시 실행)"""
        raise NotImplementedError(f"{self.platform} 업로드 미구현")

    def publish(self, content: dict, approved: bool = False) -> dict:
        """
        approved=False(기본) → CEO 승인 전이므로 업로드 금지('승인대기').
        approved=True + 자격증명 有 + DRY_RUN=false → 실제 업로드.
        그 외 → dry_run. 실패는 logs/, 결과는 output/report_<platform>.json.
        """
        creds = self._credentials()
        missing = [k for k, v in creds.items() if not v]
        dry = self.dry_run or bool(missing)
        result = {
            "platform": self.platform,
            "visibility": self.visibility,
            "approved": approved,
            "dry_run": dry,
            "missing_credentials": missing,
            "title": content.get("title"),
            "ts": datetime.datetime.now().isoformat(timespec="seconds"),
        }

        # (1) CEO 승인 게이트 — 승인 전에는 어떤 모드에서도 업로드하지 않는다.
        if not approved:
            result["status"] = "승인대기"
            _log(self.platform, "info", result)
            _write_report(self.platform, result)
            return result

        try:
            if dry:
                result["status"] = "dry_run"  # 실제 업로드 안 함 (키 없거나 DRY_RUN)
                _log(self.platform, "info", result)
            else:
                result.update(self._do_publish(content, creds))
                result["status"] = "published"
                _log(self.platform, "info", result)
        except Exception as e:  # 실패 시 logs/에 저장
            result["status"] = "error"
            result["error"] = str(e)
            _log(self.platform, "error", result)

        _write_report(self.platform, result)  # 성공/결과 리포트
        return result
