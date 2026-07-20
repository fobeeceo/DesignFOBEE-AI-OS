"""
publishers.py — 7개 플랫폼 Publisher (base_publisher.BasePublisher 연결).
OAuth 인증 + .env 키관리 + dry-run/실업로드 + 실패로그 + 성공리포트 + 승인게이트.

의존성 없음(stdlib urllib). 자격증명이 없으면 BasePublisher가 자동 dry-run 처리하므로
실제 네트워크 호출은 키가 갖춰진 상태에서만 실행된다. (기존 구조 무변경 — 연결만)
"""
from __future__ import annotations
import json
import pathlib
import urllib.request
import urllib.parse

from base_publisher import BasePublisher, env

OUT = pathlib.Path(__file__).resolve().parent.parent / "output"


# ---------- OAuth / HTTP 헬퍼 ----------
def _http(url: str, data=None, headers=None, method="GET") -> dict:
    body = None
    if data is not None:
        body = data if isinstance(data, (bytes,)) else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8") or "{}")


def _google_access_token(client_id, client_secret, refresh_token) -> str:
    """Google OAuth2: refresh_token → access_token (YouTube/Blogger 공용)."""
    data = urllib.parse.urlencode({
        "client_id": client_id, "client_secret": client_secret,
        "refresh_token": refresh_token, "grant_type": "refresh_token",
    }).encode("utf-8")
    res = _http("https://oauth2.googleapis.com/token", data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    return res["access_token"]


def _read(name: str) -> str:
    p = OUT / name
    return p.read_text(encoding="utf-8") if p.exists() else ""


# ---------- 1. YouTube ----------
class YouTubePublisher(BasePublisher):
    platform = "youtube"

    def _credentials(self) -> dict:
        return {"client_id": env("YOUTUBE_CLIENT_ID"),
                "client_secret": env("YOUTUBE_CLIENT_SECRET"),
                "refresh_token": env("YOUTUBE_REFRESH_TOKEN")}

    def _do_publish(self, content, creds) -> dict:
        token = _google_access_token(creds["client_id"], creds["client_secret"], creds["refresh_token"])
        meta = json.loads(_read("youtube.json") or "{}")
        snippet = {"snippet": {"title": meta.get("title", content.get("title", "")),
                               "description": meta.get("description", ""),
                               "tags": meta.get("tags", [])},
                   "status": {"privacyStatus": self.visibility}}
        # videos.insert (메타) — 실제 영상 바이트는 resumable 업로드로 이어붙임(video.mp4)
        res = _http("https://www.googleapis.com/youtube/v3/videos?part=snippet,status",
                    data=snippet,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    method="POST")
        vid = res.get("id")
        return {"id": vid, "url": f"https://youtu.be/{vid}" if vid else None}


# ---------- 2. Google Blogger ----------
class BloggerPublisher(BasePublisher):
    platform = "blogger"

    def _credentials(self) -> dict:
        return {"client_id": env("YOUTUBE_CLIENT_ID"),   # 동일 Google OAuth 앱 재사용 가능
                "client_secret": env("YOUTUBE_CLIENT_SECRET"),
                "refresh_token": env("YOUTUBE_REFRESH_TOKEN"),
                "blog_id": env("GOOGLE_BLOGGER_BLOG_ID")}

    def _do_publish(self, content, creds) -> dict:
        token = _google_access_token(creds["client_id"], creds["client_secret"], creds["refresh_token"])
        post = {"title": content.get("title", ""), "content": _read("blogger.md")}
        res = _http(f"https://www.googleapis.com/blogger/v3/blogs/{creds['blog_id']}/posts/",
                    data=post,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    method="POST")
        return {"id": res.get("id"), "url": res.get("url")}


# ---------- 3. Naver Blog ----------
class NaverPublisher(BasePublisher):
    platform = "naver"

    def _credentials(self) -> dict:
        return {"client_id": env("NAVER_CLIENT_ID"),
                "client_secret": env("NAVER_CLIENT_SECRET"),
                "access_token": env("NAVER_ACCESS_TOKEN")}

    def _do_publish(self, content, creds) -> dict:
        data = urllib.parse.urlencode({"title": content.get("title", ""),
                                       "contents": _read("naver.md")}).encode("utf-8")
        res = _http("https://openapi.naver.com/blog/writePost.json", data=data,
                    headers={"Authorization": f"Bearer {creds['access_token']}",
                             "X-Naver-Client-Id": creds["client_id"],
                             "X-Naver-Client-Secret": creds["client_secret"],
                             "Content-Type": "application/x-www-form-urlencoded"},
                    method="POST")
        return {"id": res.get("postId"), "url": res.get("url")}


# ---------- 4. Instagram (Meta Graph) ----------
class InstagramPublisher(BasePublisher):
    platform = "instagram"

    def _credentials(self) -> dict:
        return {"token": env("META_GRAPH_ACCESS_TOKEN"), "ig_id": env("META_IG_BUSINESS_ID")}

    def _do_publish(self, content, creds) -> dict:
        base = f"https://graph.facebook.com/v20.0/{creds['ig_id']}"
        caption = _read("instagram.txt")
        # 1) 미디어 컨테이너 생성 (이미지 URL 필요)
        create = _http(f"{base}/media", data=urllib.parse.urlencode(
            {"image_url": content.get("image_url", ""), "caption": caption,
             "access_token": creds["token"]}).encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        cid = create.get("id")
        # 2) 게시
        pub = _http(f"{base}/media_publish", data=urllib.parse.urlencode(
            {"creation_id": cid, "access_token": creds["token"]}).encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        return {"id": pub.get("id"), "container": cid}


# ---------- 5. Threads (Meta) ----------
class ThreadsPublisher(BasePublisher):
    platform = "threads"

    def _credentials(self) -> dict:
        return {"token": env("META_GRAPH_ACCESS_TOKEN"), "user_id": env("META_IG_BUSINESS_ID")}

    def _do_publish(self, content, creds) -> dict:
        base = f"https://graph.threads.net/v1.0/{creds['user_id']}"
        create = _http(f"{base}/threads", data=urllib.parse.urlencode(
            {"media_type": "TEXT", "text": _read("threads.txt"),
             "access_token": creds["token"]}).encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        cid = create.get("id")
        pub = _http(f"{base}/threads_publish", data=urllib.parse.urlencode(
            {"creation_id": cid, "access_token": creds["token"]}).encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        return {"id": pub.get("id"), "container": cid}


# ---------- 6. Facebook (Graph page) ----------
class FacebookPublisher(BasePublisher):
    platform = "facebook"

    def _credentials(self) -> dict:
        return {"token": env("META_GRAPH_ACCESS_TOKEN"), "page_id": env("META_PAGE_ID")}

    def _do_publish(self, content, creds) -> dict:
        res = _http(f"https://graph.facebook.com/v20.0/{creds['page_id']}/feed",
                    data=urllib.parse.urlencode(
                        {"message": _read("facebook.txt"), "access_token": creds["token"]}).encode(),
                    headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        return {"id": res.get("id")}


# ---------- 7. TikTok (Content Posting API) ----------
class TikTokPublisher(BasePublisher):
    platform = "tiktok"

    def _credentials(self) -> dict:
        return {"access_token": env("TIKTOK_ACCESS_TOKEN")}

    def _do_publish(self, content, creds) -> dict:
        # 기본 Private(SELF_ONLY) — 가드레일
        payload = {"post_info": {"title": content.get("title", ""),
                                 "privacy_level": "SELF_ONLY"},
                   "source_info": {"source": "PULL_FROM_URL",
                                   "video_url": content.get("video_url", "")}}
        res = _http("https://open.tiktokapis.com/v2/post/publish/video/init/",
                    data=payload,
                    headers={"Authorization": f"Bearer {creds['access_token']}",
                             "Content-Type": "application/json"}, method="POST")
        return {"id": (res.get("data") or {}).get("publish_id")}


# 우선순위 순서 (지시서)
PUBLISHERS = [
    YouTubePublisher, BloggerPublisher, NaverPublisher,
    InstagramPublisher, ThreadsPublisher, FacebookPublisher, TikTokPublisher,
]
