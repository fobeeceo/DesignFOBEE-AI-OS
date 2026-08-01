"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AREAS,
  ATTITUDE_CHECKS,
  PASS_SCORE,
  QUESTIONS,
  TOTAL_SCORE,
  gradeFor,
  type AreaCode,
} from "@/lib/franchise/diagnosisData";

/**
 * 가맹 창업 가능성 자가진단.
 *
 * ⚠️ 이 페이지에는 Reveal(스크롤 리빌)을 쓰지 않는다. opacity:0으로 시작하는 애니메이션도 금지.
 *    JS가 실패해도 문항은 항상 보여야 하기 때문이다(iOS Safari 이미지 미표시 사고의 교훈).
 *    벽돌 진행 표시(.wall)는 원본 HTML의 구조와 동작을 그대로 유지한다 — 이 페이지의 핵심 요소.
 *
 * 개인정보(이름·연락처)는 수집하지 않는다. 상담 신청 폼에서만 동의와 함께 수집한다.
 */

type Screen = "intro" | "quiet" | "result";

const AREA_CODES: AreaCode[] = ["A", "B", "C", "D", "E"];

/** 점수 → 벽돌 채도 단계. 원본의 s3/s2/s1/s0 규칙을 그대로 따른다. */
function brickTone(score: number | null): string {
  if (score === 25) return "bg-[#8C4A32] border-[#8C4A32]";
  if (score === 17) return "bg-[#B07A63] border-[#B07A63]";
  if (score === 9) return "bg-[#DCC7BB] border-[#DCC7BB]";
  if (score === 0)
    return "border-[#D5D0C6] bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,#D5D0C6_3px,#D5D0C6_4px)]";
  return "border-[#D5D0C6] bg-transparent";
}

export function DiagnosisClient() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    new Array(QUESTIONS.length).fill(null)
  );

  const question = QUESTIONS[index];

  function start() {
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setIndex(0);
    setScreen("quiet");
    window.scrollTo(0, 0);
  }

  function pick(score: number) {
    const next = [...answers];
    next[index] = score;
    setAnswers(next);

    // 벽돌이 한 장 쌓이는 것을 보여준 뒤 다음 문항으로 넘어간다(원본 260ms 유지).
    window.setTimeout(() => {
      if (index < QUESTIONS.length - 1) {
        setIndex(index + 1);
      } else {
        finish(next);
      }
    }, 260);
  }

  function finish(finalAnswers: (number | null)[]) {
    const by: Record<AreaCode, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    QUESTIONS.forEach((q, idx) => {
      by[q.area] += finalAnswers[idx] ?? 0;
    });
    const total = Object.values(by).reduce((a, b) => a + b, 0);

    // 개인정보 없이 점수만 저장한다. 실패해도 결과 표시를 막지 않는다.
    void fetch("/api/franchise-diagnosis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total, grade: gradeFor(total).letter, by, at: new Date().toISOString() }),
    }).catch(() => {});

    setScreen("result");
    window.scrollTo(0, 0);
  }

  const by: Record<AreaCode, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  QUESTIONS.forEach((q, idx) => {
    by[q.area] += answers[idx] ?? 0;
  });
  const total = Object.values(by).reduce((a, b) => a + b, 0);
  const grade = gradeFor(total);
  const sorted = [...AREA_CODES].sort((a, b) => by[b] - by[a]);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  /* ── 벽돌 진행 표시 ── */
  const wall = (
    <div className="flex flex-col-reverse gap-[3px] border border-[#D5D0C6] bg-[#E6E3DC] p-[14px]">
      {AREA_CODES.map((code, rowIdx) => (
        <div key={code} className="flex items-center gap-[3px]">
          <span className="w-[14px] flex-none font-mono text-[10px] text-[#8A827A]">{code}</span>
          <div className={`flex flex-1 gap-[3px] ${rowIdx % 2 === 1 ? "pl-[11px]" : ""}`}>
            {QUESTIONS.map((q, idx) =>
              q.area !== code ? null : (
                <div
                  key={idx}
                  className={`h-[15px] flex-1 border transition-colors duration-300 ${brickTone(
                    answers[idx]
                  )} ${idx === index && screen === "quiet" ? "border-[1.5px] border-[#1B1815]" : ""}`}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (screen === "intro") {
    return (
      <div className="mx-auto max-w-[560px]">
        <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#8A827A]">
          GBRICK Coffee · 가맹 사전 진단
        </p>
        <h1 className="mt-3 text-[30px] font-bold leading-[1.35] tracking-tight">
          커피를 잘 만드는 사람보다,
          <br />
          사람을 편안하게 만드는 사람
        </h1>

        <blockquote className="my-[26px] border-l-[3px] border-[#8C4A32] py-[2px] pl-[18px] text-[19px] leading-[1.65]">
          매장의 분위기는 점주의 분위기에서 시작됩니다. 기술은 교육할 수 있지만, 태도는 쉽게 바뀌지
          않습니다.
          <cite className="mt-[10px] block font-mono text-[13px] not-italic tracking-[0.1em] text-[#8A827A]">
            이대성 · 주식회사 디자인포비 대표이사
          </cite>
        </blockquote>

        <p className="text-[15px] leading-relaxed text-[#4A443E]">
          GBRICK Coffee는 가맹점 수보다 가맹점 성공률을 먼저 봅니다. 잘못된 가맹 하나가 좋은 가맹
          열을 어렵게 만들기 때문입니다. 아래 진단은 실제로 성공한 점주들의 공통점을 기준으로
          만들었습니다.
        </p>

        <table className="my-[22px] w-full border-collapse text-[15px]">
          <tbody>
            {[
              ["문항", "20문항 · 약 4분"],
              ["배점", "5개 영역 × 100점 = 500점 만점"],
              ["기준선", "350점 이상이면 상담 진행 대상입니다"],
              ["결과", "즉시 확인 · 연락처 없이 진행됩니다"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="w-[96px] border-b border-[#D5D0C6] py-[9px] pt-3 align-top font-mono text-[15px] tracking-[0.06em] text-[#8A827A]">
                  {k}
                </td>
                <td className="border-b border-[#D5D0C6] py-[9px] align-top">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={start}
          className="mt-2 block w-full bg-[#1B1815] p-4 text-[15.5px] font-medium text-[#F6F4F0] transition-colors hover:bg-[#8C4A32]"
        >
          진단 시작하기
        </button>

        <p className="mt-6 text-[15px] leading-relaxed text-[#8A827A]">
          본 진단은 참고용 사전 자료이며 가맹 계약의 승인·거절을 확정하지 않습니다. 실제 심사는 대표
          인터뷰와 현장 실사를 거쳐 진행됩니다.
        </p>
      </div>
    );
  }

  if (screen === "quiet") {
    return (
      <div className="mx-auto max-w-[560px]">
        {wall}

        <div className="mb-2 mt-[26px] flex items-baseline justify-between">
          <span className="font-mono text-[15px] tracking-[0.08em] text-[#8A827A]">
            {String(index + 1).padStart(2, "0")} / {QUESTIONS.length}
          </span>
          <span className="font-mono text-[14px] uppercase tracking-[0.14em] text-[#8C4A32]">
            {AREAS[question.area].name}
          </span>
        </div>

        <p className="mb-[14px] text-[20px] leading-[1.55]">{question.text}</p>

        {question.note && (
          <p className="mb-[18px] border-l-2 border-[#B8912F] bg-[#E6E3DC] px-[14px] py-3 text-[15px] leading-relaxed text-[#4A443E]">
            {question.note}
          </p>
        )}

        <div>
          {question.options.map(([label, score]) => (
            <button
              key={label}
              type="button"
              onClick={() => pick(score)}
              className="mb-[9px] block w-full border border-[#D5D0C6] bg-white px-4 py-[15px] text-left text-[15px] leading-[1.55] text-[#1B1815] transition-colors hover:border-[#1B1815] hover:bg-[#E6E3DC]"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => index > 0 && setIndex(index - 1)}
          className={`mt-[6px] py-[10px] font-mono text-[15px] tracking-[0.08em] text-[#8A827A] ${
            index === 0 ? "invisible" : ""
          }`}
        >
          ← 이전 문항
        </button>
      </div>
    );
  }

  /* ── 결과 ── */
  return (
    <div className="mx-auto max-w-[560px]">
      <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#8A827A]">진단 결과</p>

      <div className="mt-6 bg-[#1B1815] px-5 py-[30px] text-center text-[#F6F4F0]">
        <div className="text-[64px] font-bold leading-none">{grade.letter}</div>
        <div className="mt-3 font-mono text-[15px] tracking-[0.1em] opacity-75">
          {total} / {TOTAL_SCORE}
        </div>
        <div className="mt-4 text-[19px] leading-[1.5]">{grade.verdict}</div>
        <div className="mt-[10px] text-[15px] opacity-60">
          {total >= PASS_SCORE
            ? `상담 진행 기준(${PASS_SCORE}점)을 넘었습니다`
            : `상담 진행 기준은 ${PASS_SCORE}점입니다`}
        </div>
      </div>

      <div className="mt-8">
        {AREA_CODES.map((code) => (
          <div key={code} className="mb-4">
            <div className="mb-[6px] flex items-baseline justify-between text-[15px]">
              <b>{AREAS[code].name}</b>
              <span className="font-mono text-[15px] text-[#8A827A]">{by[code]} / 100</span>
            </div>
            <div className="h-[10px] w-full bg-[#E6E3DC]">
              <div
                className="h-full bg-[#8C4A32] transition-[width] duration-700"
                style={{ width: `${by[code]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {[
        { tag: "가장 강한 영역", body: `${AREAS[best].name} (${by[best]}점) — ${AREAS[best].desc}` },
        {
          tag: "보완이 필요한 영역",
          body: `${AREAS[worst].name} (${by[worst]}점) — ${AREAS[worst].desc} ${grade.message}`,
        },
      ].map((n) => (
        <div key={n.tag} className="mt-4 border border-[#D5D0C6] bg-[#E6E3DC] p-4">
          <span className="font-mono text-[14px] uppercase tracking-[0.14em] text-[#8C4A32]">
            {n.tag}
          </span>
          <p className="mt-2 text-[15px] leading-relaxed text-[#4A443E]">{n.body}</p>
        </div>
      ))}

      <hr className="my-8 h-px border-0 bg-[#D5D0C6]" />

      <h2 className="text-[21px] font-bold leading-[1.45]">점수로 재지 않는 것</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#4A443E]">
        실제 성공한 점주들의 공통점입니다. 점수에는 넣지 않았습니다. 혼자 조용히 체크해 보시면
        좋겠습니다.
      </p>
      <ul className="mt-4">
        {ATTITUDE_CHECKS.map((c) => (
          <li
            key={c}
            className="border-b border-[#D5D0C6] py-[10px] pl-6 text-[15px] leading-relaxed text-[#4A443E] before:ml-[-24px] before:mr-[10px] before:content-['□']"
          >
            {c}
          </li>
        ))}
      </ul>

      <Link
        href="/franchise#consult"
        className="mt-8 block w-full bg-[#1B1815] p-4 text-center text-[15.5px] font-medium text-[#F6F4F0] transition-colors hover:bg-[#8C4A32]"
      >
        가맹 상담 신청하기
      </Link>
      <button
        type="button"
        onClick={start}
        className="mt-2 block w-full border border-[#1B1815] bg-transparent p-4 text-[15.5px] font-medium text-[#1B1815] transition-colors hover:bg-[#1B1815] hover:text-[#F6F4F0]"
      >
        다시 진단하기
      </button>

      <p className="mt-6 text-[15px] leading-relaxed text-[#8A827A]">
        주식회사 디자인포비 · 대표이사 이대성 · 02-517-1474
        <br />
        본 결과는 사전 참고 자료이며 가맹 승인·거절을 확정하지 않습니다. 정확한 창업 조건은
        정보공개서와 함께 안내드립니다.
      </p>
    </div>
  );
}
