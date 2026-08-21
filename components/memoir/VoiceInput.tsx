"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

/**
 * 말로 답하기 — 브라우저 음성 인식(Web Speech API)으로 받아쓴다.
 *
 * 왜 서버로 음성을 보내지 않는가:
 *  · 자서전 내용이 서버를 거치지 않는다(§0-2 원칙 6, 개인정보 최소화).
 *  · 별도 비용이 들지 않는다(승인 대상 회피).
 *  · 실시간으로 글자가 보여서 어르신이 "녹음되고 있구나"를 눈으로 확인할 수 있다.
 *
 * ⚠️ 브라우저마다 지원이 다르다. 지원하지 않으면 버튼을 숨기고,
 *    스마트폰 키보드의 마이크 버튼(iOS·안드로이드 기본 받아쓰기)을 안내한다.
 *    이 경로는 어떤 기기에서도 동작하므로 실제로는 이쪽이 더 확실하다.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface VoiceInputProps {
  /** 확정된 문장이 나올 때마다 호출된다. 부모가 기존 텍스트 뒤에 이어붙인다. */
  onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  /** 사용자가 멈춤을 누르지 않았는데 브라우저가 끊은 경우 다시 켜기 위한 플래그. */
  const wantListening = useRef(false);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    recognition.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    setError(null);
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          onTranscript(text.trim());
        } else {
          pending += text;
        }
      }
      setInterim(pending);
    };

    rec.onerror = (event: any) => {
      if (event?.error === "not-allowed") {
        setError("마이크 사용이 차단되어 있습니다. 브라우저 설정에서 마이크를 허용해 주세요.");
      } else if (event?.error === "no-speech") {
        // 조용하면 흔히 나는 오류다. 화면에 띄우면 오히려 방해가 된다.
        return;
      } else {
        setError("음성 인식이 중단되었습니다. 다시 눌러 주세요.");
      }
      wantListening.current = false;
      setListening(false);
    };

    // iOS 사파리는 잠깐 조용해도 인식을 끝내버린다. 사용자가 멈추기 전까지 다시 켠다.
    rec.onend = () => {
      setInterim("");
      if (wantListening.current) {
        try {
          rec.start();
        } catch {
          wantListening.current = false;
          setListening(false);
        }
      }
    };

    recognition.current = rec;
    wantListening.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("음성 인식을 시작하지 못했습니다. 키보드의 마이크 버튼을 사용해 주세요.");
      wantListening.current = false;
    }
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      wantListening.current = false;
      recognition.current?.stop();
    };
  }, []);

  if (!supported) {
    return (
      <p className="rounded-xl bg-[#F1EDE6] px-4 py-3 text-[15px] leading-relaxed text-[#5C5346]">
        이 브라우저는 말로 받아쓰기를 지원하지 않습니다. 아래 칸을 누른 뒤
        <strong className="font-semibold text-[#1B1815]"> 키보드에 있는 마이크 버튼</strong>을 누르면
        말한 대로 글이 적힙니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[17px] font-semibold transition-colors ${
          listening
            ? "bg-[#8C4A32] text-white"
            : "border-2 border-[#8C4A32] bg-white text-[#8C4A32]"
        }`}
      >
        {listening ? <Square className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
        {listening ? "말하기 멈춤" : "말로 답하기"}
      </button>

      {listening && (
        <p className="rounded-xl bg-[#FDF7F3] px-4 py-3 text-[15px] leading-relaxed text-[#5C5346]">
          듣고 있습니다. 편하게 말씀하세요.
          {interim && <span className="mt-1 block text-[#1B1815]">{interim}</span>}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-[#FBEDE9] px-4 py-3 text-[15px] leading-relaxed text-[#8C4A32]">
          {error}
        </p>
      )}
    </div>
  );
}
