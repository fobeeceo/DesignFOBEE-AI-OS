"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "gbrick_ios_install_hint_dismissed";

/** 아이폰 사파리에서 연 손님에게, 주문 알림을 받으려면 홈 화면에 추가해야 한다고 미리 알려 준다 (애플 규칙) */
export default function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const installed = (navigator as { standalone?: boolean }).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === "1"; } catch { /* 저장소를 못 쓰면 계속 보여 준다 */ }
    setShow(isIos && !installed && !dismissed);
  }, []);

  if (!show) return null;
  return (
    <div style={{ background: "#FEF3E2", borderBottom: "1px solid #F3D9AE", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <p style={{ flex: 1, margin: 0, fontSize: 14, lineHeight: 1.55, color: "#7A4A12", fontWeight: 600 }}>
        🔔 아이폰에서 주문 알림을 받으려면 <b>홈 화면에 추가</b>해 주세요.<br />
        공유 버튼 → ‘홈 화면에 추가’ → 홈 화면의 지브릭커피 아이콘으로 열기
      </p>
      <button
        onClick={() => { try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } setShow(false); }}
        aria-label="안내 닫기"
        style={{ background: "none", border: "none", color: "#7A4A12", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 2 }}>
        ✕
      </button>
    </div>
  );
}
