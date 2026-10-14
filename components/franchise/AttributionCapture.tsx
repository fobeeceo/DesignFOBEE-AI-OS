"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/franchise/attribution";

/**
 * 화면 없이 유입 경로만 세션에 잡아 둔다.
 * 영상 링크로 자가진단(/franchise/diagnosis)에 먼저 들어온 방문자가 나중에 상담 폼을
 * 제출해도 어느 채널에서 왔는지 남게 하려는 것이다.
 */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
