"""
BasePublisher — 모든 플랫폼 퍼블리셔의 공통 골격.
가드레일: (1) API Key는 .env에서만 (2) 기본 Private/dry-run (3) 실패 시 logs/ 저장.
기존 OS 무파괴 — 이 모듈은 자기 워크스페이스에서만 동작.
"""
from __future__ import annotations
import os
import json
import datetime
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)


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


class BasePublisher:
    platform = "base"

    def __init__(self) -> None:
        self.dry_run = env("DRY_RUN", "true").lower() != "false"
        self.visibility = env("DEFAULT_VISIBILITY", "private")

    def _credentials(self) -> dict:
        """서브클래스가 override — .env 키만 반환."""
        return {}

    def publish(self, content: dict) -> dict:
        creds = self._credentials()
        missing = [k for k, v in creds.items() if not v]
        # 가드레일: 자격증명 없으면 강제 dry-run
        dry = self.dry_run or bool(missing)
        result = {
            "platform": self.platform,
            "visibility": self.visibility,
            "dry_run": dry,
            "missing_credentials": missing,
            "title": content.get("title"),
        }
        try:
            if dry:
                result["status"] = "dry_run"  # 실제 업로드 안 함
                _log(self.platform, "info", result)
            else:
                result.update(self._do_publish(content, creds))
                result["status"] = "published"
                _log(self.platform, "info", result)
        except Exception as e:  # 실패 시 logs/에 저장
            result["status"] = "error"
            result["error"] = str(e)
            _log(self.platform, "error", result)
        return result

    def _do_publish(self, content: dict, creds: dict) -> dict:
        """서브클래스가 실제 API 호출 구현 (자격증명 확보 후 활성화)."""
        raise NotImplementedError(f"{self.platform} 업로드 미구현 — API 자격증명 연결 필요")


# 예시 서브클래스 (구조 데모) — 실제 API 호출부는 자격증명 확보 후 채운다.
class YouTubePublisher(BasePublisher):
    platform = "youtube"

    def _credentials(self) -> dict:
        return {
            "client_id": env("YOUTUBE_CLIENT_ID"),
            "client_secret": env("YOUTUBE_CLIENT_SECRET"),
            "refresh_token": env("YOUTUBE_REFRESH_TOKEN"),
        }
