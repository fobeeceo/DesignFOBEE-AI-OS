"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emptyBook, type MemoirBook, type MemoirNote } from "@/lib/memoir/manuscript";

/**
 * 자서전 원고는 이 브라우저 안에만 저장한다.
 *
 * 서버에 보내지 않는 이유:
 *  1. 자서전은 가장 사적인 기록이다. 회복·가족·신앙까지 들어간다. 기본값은 "내 폰에만".
 *  2. 로그인 없이 바로 쓸 수 있어야 한다 — 주 사용자가 40~80대다.
 *  3. 서버 저장은 DB 마이그레이션이 필요하고, 이는 대표 승인 대상이다(§0-2 원칙 6).
 *
 * 대신 브라우저 데이터가 지워지면 원고도 사라지므로, 화면에서 "내보내기"를 반복해서 권한다.
 * 나중에 서버 동기화를 붙일 때는 이 모듈만 어댑터로 바꾸면 된다.
 */
const STORAGE_KEY = "fobee:memoir:v1";

export function loadBook(): MemoirBook {
  if (typeof window === "undefined") return emptyBook();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBook();
    const parsed = JSON.parse(raw) as Partial<MemoirBook>;
    return {
      ...emptyBook(),
      ...parsed,
      answers: parsed.answers ?? {},
      notes: parsed.notes ?? [],
    };
  } catch {
    // 저장된 값이 깨졌더라도 빈 화면 대신 새 원고로 시작한다.
    return emptyBook();
  }
}

function persist(book: MemoirBook): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
    return true;
  } catch {
    // 용량 초과(대개 5MB)나 사파리 시크릿 모드. 화면에 경고를 띄우기 위해 실패를 알린다.
    return false;
  }
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useMemoirBook() {
  const [book, setBook] = useState<MemoirBook>(emptyBook);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setBook(loadBook());
    setReady(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  /**
   * 상태를 바꾸고 0.6초 뒤에 저장한다.
   * 구술·타이핑 중에는 글자가 계속 들어오므로 매 입력마다 쓰면 낭비다.
   */
  const mutate = useCallback((fn: (prev: MemoirBook) => MemoirBook) => {
    setBook((prev) => {
      const next = fn(prev);
      setSaveState("saving");
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSaveState(persist(next) ? "saved" : "error");
      }, 600);
      return next;
    });
  }, []);

  const setAnswer = useCallback(
    (questionId: string, text: string, fromVoice?: boolean) => {
      mutate((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            questionId,
            text,
            updatedAt: new Date().toISOString(),
            fromVoice: fromVoice || prev.answers[questionId]?.fromVoice,
          },
        },
      }));
    },
    [mutate]
  );

  const setMeta = useCallback(
    (meta: Partial<Pick<MemoirBook, "author" | "title" | "subtitle">>) => {
      mutate((prev) => ({ ...prev, ...meta }));
    },
    [mutate]
  );

  const addNote = useCallback(
    (note: Omit<MemoirNote, "id" | "updatedAt">) => {
      mutate((prev) => ({
        ...prev,
        notes: [
          ...prev.notes,
          { ...note, id: `note-${Date.now()}`, updatedAt: new Date().toISOString() },
        ],
      }));
    },
    [mutate]
  );

  const removeNote = useCallback(
    (id: string) => {
      mutate((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
    },
    [mutate]
  );

  /** 백업 파일에서 되돌리기. 덮어쓰기이므로 화면에서 반드시 한 번 확인을 받는다(§0-2 원칙 6). */
  const replaceBook = useCallback((next: MemoirBook) => mutate(() => next), [mutate]);

  return { book, ready, saveState, setAnswer, setMeta, addNote, removeNote, replaceBook };
}

/** 백업 파일 이름. 날짜가 들어가 있어야 여러 번 내려받아도 덮어쓰지 않는다. */
export function backupFileName(ext: "json" | "md"): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `자서전-원고-${stamp}.${ext}`;
}

export function downloadText(fileName: string, text: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
