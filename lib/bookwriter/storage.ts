"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emptyProject, normalizeProject, type BookProject } from "@/lib/bookwriter/project";

/**
 * 책 원고는 이 브라우저 안에만 저장한다 — 자서전 코너(lib/memoir/storage.ts)와 같은 이유.
 * 서버 저장은 DB 마이그레이션이 필요하고 대표 승인 대상이다(§0-2 원칙 6).
 * 브라우저 데이터가 지워지면 원고도 사라지므로 화면에서 백업 내려받기를 권한다.
 */
const STORAGE_KEY = "fobee:bookwriter:v1";

function load(): BookProject {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProject(JSON.parse(raw)) : emptyProject();
  } catch {
    return emptyProject();
  }
}

function persist(p: BookProject): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useBookProject() {
  const [project, setProject] = useState<BookProject>(emptyProject);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setProject(load());
    setReady(true);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  /** 타이핑마다 쓰지 않고 0.6초 뒤에 한 번 저장한다. */
  const update = useCallback((fn: (prev: BookProject) => BookProject) => {
    setProject((prev) => {
      const next = { ...fn(prev), updatedAt: new Date().toISOString() };
      setSaveState("saving");
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSaveState(persist(next) ? "saved" : "error");
      }, 600);
      return next;
    });
  }, []);

  return { project, ready, saveState, update };
}

/** 내려받기는 자서전 코너와 같은 함수를 쓴다. */
export { downloadText } from "@/lib/memoir/storage";
