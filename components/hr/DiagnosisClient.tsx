"use client";

import { useState } from "react";
import {
  AREAS,
  ATTITUDE_CHECKS,
  DRINK_RECIPES,
  QUESTIONS,
  TOTAL_SCORE,
  gradeFor,
  areaMaxFor,
  type AreaCode,
} from "@/lib/hr/diagnosisData";

type Screen = "intro" | "material" | "quiz" | "result";

/** 기억·습득 테스트가 시작되는 지점. 이 문항 직전에 제조 순서 자료를 한 번 보여준다. */
const FIRST_TEST_INDEX = QUESTIONS.findIndex((q) => q.isTest);

/**
 * 보기 순서를 섞는다.
 *
 * ⚠️ 원본 데이터는 항상 최고점(25점) 보기가 맨 위에 있다. 그대로 두면 지원자가
 *    내용을 읽지 않고 1번만 골라도 만점이 나온다(실제로 그렇게 만점이 나왔다).
 *    응시 시작 시 한 번만 섞어 두고 시험 중에는 순서를 유지한다 —
 *    문항을 오갈 때마다 순서가 바뀌면 응답이 흔들리기 때문이다.
 */
function shuffledOrders(): number[][] {
  return QUESTIONS.map((q) => {
    const idx = q.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
}

const AREA_CODES: AreaCode[] = ["S", "R", "C", "L", "T"];

function getBrickClass(
  score: number | null,
): string {
  if (score === null) return "border-[#D5D0C6] bg-transparent";
  if (score === 25) return "bg-[#8C4A32] border-[#8C4A32]";
  if (score === 17) return "bg-[#B07A63] border-[#B07A63]";
  if (score === 9) return "bg-[#DCC7BB] border-[#DCC7BB]";
  return "border-[#D5D0C6] bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,#D5D0C6_3px,#D5D0C6_4px)]";
}

export function DiagnosisClient() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    new Array(QUESTIONS.length).fill(null)
  );
  const [orders, setOrders] = useState<number[][]>(shuffledOrders);

  const question = QUESTIONS[index];

  function start() {
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setOrders(shuffledOrders());
    setIndex(0);
    setScreen("quiz");
    window.scrollTo(0, 0);
  }

  function pick(score: number) {
    const next = [...answers];
    next[index] = score;
    setAnswers(next);

    window.setTimeout(() => {
      if (index < QUESTIONS.length - 1) {
        const nextIndex = index + 1;
        // 기억·습득 테스트 직전에 제조 순서 자료를 한 번 보여준다.
        if (nextIndex === FIRST_TEST_INDEX) setScreen("material");
        setIndex(nextIndex);
      } else {
        finish(next);
      }
    }, 260);
  }

  function finish(finalAnswers: (number | null)[]) {
    const by: Record<AreaCode, number> = { S: 0, R: 0, C: 0, L: 0, T: 0 };
    QUESTIONS.forEach((q, idx) => {
      by[q.area] += finalAnswers[idx] ?? 0;
    });

    // 영역별 원점수를 100점 만점으로 환산 후 합산 → 최종 500점
    const normalizedTotal =
      (by.S / areaMaxFor("S")) * 100 +
      (by.R / areaMaxFor("R")) * 100 +
      (by.C / areaMaxFor("C")) * 100 +
      (by.L / areaMaxFor("L")) * 100 +
      (by.T / areaMaxFor("T")) * 100;

    const total = Math.min(TOTAL_SCORE, Math.round(normalizedTotal));
    const grade = gradeFor(total);

    // API 전송: total·by 모두 환산 기준(총 500 / 영역별 100).
    // 원점수를 보내면 결과 화면과 서버 기록의 기준이 달라져 나중에 대조가 안 된다.
    const byNormalized = AREA_CODES.reduce<Record<string, number>>((acc, code) => {
      acc[code] = Math.round((by[code] / areaMaxFor(code)) * 100);
      return acc;
    }, {});

    void fetch("/api/hr-diagnosis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total,
        grade: grade.letter,
        by: byNormalized,
        at: new Date().toISOString(),
      }),
    }).catch(() => {});

    setScreen("result");
    window.scrollTo(0, 0);
  }

  const by: Record<AreaCode, number> = { S: 0, R: 0, C: 0, L: 0, T: 0 };
  QUESTIONS.forEach((q, idx) => {
    by[q.area] += answers[idx] ?? 0;
  });

  // 결과 화면용: 영역별 환산점수 (100점 만점)
  const byNorm: Record<AreaCode, number> = {
    S: Math.round((by.S / areaMaxFor("S")) * 100),
    R: Math.round((by.R / areaMaxFor("R")) * 100),
    C: Math.round((by.C / areaMaxFor("C")) * 100),
    L: Math.round((by.L / areaMaxFor("L")) * 100),
    T: Math.round((by.T / areaMaxFor("T")) * 100),
  };

  const normalizedTotal =
    byNorm.S + byNorm.R + byNorm.C + byNorm.L + byNorm.T;
  const total = Math.min(TOTAL_SCORE, Math.round(normalizedTotal));
  const grade = gradeFor(total);

  const sorted = [...AREA_CODES].sort((a, b) => byNorm[b] - byNorm[a]);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  /* ── 벽돌 진행 표시 ── */
  const wall = (
    <div className="flex flex-col-reverse gap-[3px] border border-[#D5D0C6] bg-[#E6E3DC] p-[14px]">
      {AREA_CODES.map((code, rowIdx) => (
        <div key={code} className="flex items-center gap-[3px]">
          <span className="w-[14px] flex-none font-mono text-[10px] text-[#8A827A]">
            {code}
          </span>
          <div
            className={`flex flex-1 gap-[3px] ${rowIdx % 2 === 1 ? "pl-[11px]" : ""}`}
          >
            {QUESTIONS.map((q, idx) =>
              q.area !== code ? null : (
                <div
                  key={idx}
                  className={`h-[15px] flex-1 border transition-colors duration-300 ${getBrickClass(answers[idx])} ${idx === index && screen === "quiz" ? "border-[1.5px] border-[#1B1815]" : ""}`}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Intro ── */
  if (screen === "intro") {
    return (
      <div className="mx-auto max-w-[560px]">
        <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#8A827A]">
          GBRICK Coffee · 직원·알바 채용 사전 진단
        </p>
        <h1 className="mt-3 text-[30px] font-bold leading-[1.35] tracking-tight">
          커피 한 잔보다,
          <br />
          손님을 대하는 태도
        </h1>
        <blockquote className="my-[26px] border-l-[3px] border-[#8C4A32] py-[2px] pl-[18px] text-[19px] leading-[1.65]">
          매장의 분위기는 함께 일하는 사람의 태도에서 시작됩니다.
          기술은 교육할 수 있지만, 사람을 대하는 마음은 쉽게 바뀌지 않습니다.
          <cite className="mt-[10px] block font-mono text-[13px] not-italic tracking-[0.1em] text-[#8A827A]">
            주식회사 디자인포비 · GBRICK Coffee
          </cite>
        </blockquote>
        <p className="text-[15px] leading-relaxed text-[#4A443E]">
          GBRICK Coffee는 함께 일할 사람을 찾을 때, 지금의 모습만이 아니라
          함께 성장할 가능성을 먼저 봅니다. 아래 진단은 실제 매장에서 일하는
          직원들의 모습을 기준으로 만들었습니다.
        </p>
        <table className="my-[22px] w-full border-collapse text-[15px]">
          <tbody>
            {[
              // 문항 수는 데이터에서 세어 쓴다. 문항이 늘어도 저절로 맞는다.
              ["문항", `${QUESTIONS.length}문항 · 약 5분`],
              ["배점", `5개 영역, 영역별 100점씩 환산 — 총 ${TOTAL_SCORE}점`],
              ["결과", "즉시 확인 · 연락처 없이 진행됩니다"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="w-[96px] border-b border-[#D5D0C6] py-[9px] pt-3 align-top font-mono text-[15px] tracking-[0.06em] text-[#8A827A]">{k}</td>
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
          본 진단은 참고용 사전 자료이며 채용 여부를 확정하지 않습니다.
          실제 채용 판단은 면접·실기·업무 적합성 등을 종합하여 사람이 결정합니다.
        </p>
      </div>
    );
  }

  /* ── 제조 순서 자료 (기억·습득 테스트 직전 1회) ── */
  if (screen === "material") {
    return (
      <div className="mx-auto max-w-[560px]">
        <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#8C4A32]">
          기억·습득 테스트 · 자료
        </p>
        <h2 className="mt-3 text-[24px] font-bold leading-[1.4]">
          아래 제조 순서를 외워 주세요
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#4A443E]">
          교육 영상에서 본 순서입니다. 다음 화면부터는 이 자료가 보이지 않습니다.
          숫자를 외우는 것이 아니라 <b>과정의 순서</b>를 기억하시면 됩니다.
        </p>

        <div className="mt-6">
          {DRINK_RECIPES.map((r) => (
            <div key={r.name} className="mb-4 border border-[#D5D0C6] bg-white p-4">
              <b className="text-[16px]">{r.name}</b>
              <ol className="mt-2">
                {r.steps.map((s, i) => (
                  <li key={s} className="text-[15px] leading-[1.9] text-[#1B1815]">
                    <span className="mr-2 font-mono text-[13px] text-[#8C4A32]">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              {r.memo && (
                <p className="mt-2 border-t border-[#E6E3DC] pt-2 text-[14px] leading-relaxed text-[#8A827A]">
                  {r.memo}
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setScreen("quiz");
            window.scrollTo(0, 0);
          }}
          className="mt-2 block w-full bg-[#1B1815] p-4 text-[15.5px] font-medium text-[#F6F4F0] transition-colors hover:bg-[#8C4A32]"
        >
          외웠습니다 · 문제 풀기
        </button>
      </div>
    );
  }

  /* ── 질문 화면 ── */
  if (screen === "quiz") {
    return (
      <div className="mx-auto max-w-[560px]">
        {wall}
        <div className="mb-2 mt-[26px] flex items-baseline justify-between">
          <span className="font-mono text-[15px] tracking-[0.08em] text-[#8A827A]">
            {String(index + 1).padStart(2, "0")} / {QUESTIONS.length}
          </span>
          <span className="font-mono text-[14px] uppercase tracking-[0.14em] text-[#8C4A32]">
            {AREAS[question.area].name}
            {question.isTest ? " · 기억·습득 테스트" : ""}
          </span>
        </div>
        <p className="mb-[18px] text-[20px] leading-[1.55]">{question.text}</p>
        {/* question.note는 채점 기준(대표 전용)이라 지원자에게 보여주지 않는다.
            m-1~m-3은 note에 정답 순서가 적혀 있어 노출 시 시험이 성립하지 않는다.
            (2026-08-18 대표 지시) */}
        <div>
          {/* 보기는 응시 시작 시 섞은 순서로 보여준다. 원본은 항상 정답이 맨 위다. */}
          {(orders[index] ?? question.options.map((_, i) => i)).map((optIdx) => {
            const [label, score] = question.options[optIdx];
            return (
            <button
              key={label}
              type="button"
              onClick={() => pick(score)}
              className="mb-[9px] block w-full border border-[#D5D0C6] bg-white px-4 py-[15px] text-left text-[15px] leading-[1.55] text-[#1B1815] transition-colors hover:border-[#1B1815] hover:bg-[#E6E3DC]"
            >
              {label}
            </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => index > 0 && setIndex(index - 1)}
          className={`mt-[6px] py-[10px] font-mono text-[15px] tracking-[0.08em] text-[#8A827A] ${index === 0 ? "invisible" : ""}`}
        >
          ← 이전 문항
        </button>
      </div>
    );
  }

  /* ── 결과 화면 ── */
  return (
    <div className="mx-auto max-w-[560px]">
      <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#8A827A]">
        진단 결과
      </p>
      <div className="mt-6 bg-[#1B1815] px-5 py-[30px] text-center text-[#F6F4F0]">
        <div className="text-[64px] font-bold leading-none">{grade.letter}</div>
        <div className="mt-3 font-mono text-[15px] tracking-[0.1em] opacity-75">
          {total} / {TOTAL_SCORE}
        </div>
        <div className="mt-4 text-[19px] leading-[1.5]">{grade.verdict}</div>
        {/* 참고 기준선(PASS_SCORE)은 응시자에게 보여주지 않는다(2026-08-18 대표 지시).
            합격선처럼 읽혀 응시자가 스스로 당락을 판단하게 되기 때문이다.
            기준선은 관리자 판단용으로만 쓰고 API 기록에는 그대로 남는다. */}
      </div>
      <div className="mt-8">
        {AREA_CODES.map((code) => (
          <div key={code} className="mb-4">
            <div className="mb-[6px] flex items-baseline justify-between text-[15px]">
              <b>{AREAS[code].name}</b>
              <span className="font-mono text-[15px] text-[#8A827A]">
                {byNorm[code]} / {100}
              </span>
            </div>
            <div className="h-[10px] w-full bg-[#E6E3DC]">
              <div
                className="h-full bg-[#8C4A32] transition-[width] duration-700"
                style={{ width: `${byNorm[code]}%` }}
              />
            </div>
            <div className="mt-[4px] text-[13px] text-[#8A827A] font-mono">
              원점수: {by[code]} / {areaMaxFor(code)}
            </div>
          </div>
        ))}
      </div>
      {[
        { tag: "가장 강한 영역", body: `${AREAS[best].name} (${byNorm[best]}점) — ${AREAS[best].desc}` },
        { tag: "더 살펴보면 좋은 영역", body: `${AREAS[worst].name} (${byNorm[worst]}점) — ${AREAS[worst].desc} ${grade.message}` },
      ].map((n) => (
        <div key={n.tag} className="mt-4 border border-[#D5D0C6] bg-[#E6E3DC] p-4">
          <span className="font-mono text-[14px] uppercase tracking-[0.14em] text-[#8C4A32]">{n.tag}</span>
          <p className="mt-2 text-[15px] leading-relaxed text-[#4A443E]">{n.body}</p>
        </div>
      ))}
      <hr className="my-8 h-px border-0 bg-[#D5D0C6]" />
      <h2 className="text-[21px] font-bold leading-[1.45]">점수로 재지 않는 것</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#4A443E]">
        이 진단은 지원자의 자기보고식 응답을 바탕으로 합니다.
        실제 업무 태도와 역량은 면접·실기·업무 관찰을 통해 별도로 확인해야 합니다.
      </p>
      <ul className="mt-4">
        {ATTITUDE_CHECKS.map((c) => (
          <li key={c} className="border-b border-[#D5D0C6] py-[10px] pl-6 text-[15px] leading-relaxed text-[#4A443E] before:ml-[-24px] before:mr-[10px] before:content-['□']">
            {c}
          </li>
        ))}
      </ul>
      <hr className="my-8 h-px border-0 bg-[#D5D0C6]" />
      <h2 className="text-[21px] font-bold leading-[1.45]">다음 단계</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#4A443E]">
        진단을 완료해 주셔서 감사합니다.
        결과는 참고 자료이며 채용을 확정하지 않습니다.
        면접·실기·업무 적합성 등을 종합하여 사람이 채용 여부를 결정합니다.
      </p>
      <p className="mt-6 text-[15px] leading-relaxed text-[#8A827A]">
        주식회사 디자인포비 · GBRICK Coffee
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={start}
          className="block w-full border border-[#1B1815] bg-transparent p-4 text-[15.5px] font-medium text-[#1B1815] transition-colors hover:bg-[#1B1815] hover:text-[#F6F4F0]"
        >
          다시 진단하기
        </button>
      </div>
      <p className="mt-6 text-[15px] leading-relaxed text-[#8A827A]">
        본 진단은 직원·알바 지원자의 성향과 업무 관련 역량을 미리 살펴보기 위한 참고 자료입니다.
        진단 결과만으로 채용 여부를 결정하지 않으며,
        실제 채용 판단은 면접·실기·업무 적합성 등을 종합하여 사람이 결정합니다.
      </p>
    </div>
  );
}
