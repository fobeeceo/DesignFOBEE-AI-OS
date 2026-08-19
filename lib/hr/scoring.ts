import { AREA_MAX, QUESTIONS, TOTAL_SCORE, areaMaxFor, gradeFor, type AreaCode } from "@/lib/hr/diagnosisData";

/**
 * HR 진단 점수 계산 — 화면과 서버가 같은 함수를 쓰도록 분리했다.
 *
 * ⚠️ 원점수 단순 합산이 아니다. 영역마다 문항 수가 달라 원점수 최대가 다르므로
 *    영역별 100점 만점으로 환산한 뒤 합산한다. S+R+C+L+T = 최대 500점.
 */

export const AREA_CODES: AreaCode[] = ["S", "R", "C", "L", "T"];

export type ScoreResult = {
  /** 영역별 원점수 */
  raw: Record<AreaCode, number>;
  /** 영역별 100점 환산 */
  byNorm: Record<AreaCode, number>;
  /** 환산 합계 (0~500) */
  total: number;
  grade: string;
};

export function scoreDiagnosis(answers: (number | null)[]): ScoreResult {
  const raw: Record<AreaCode, number> = { S: 0, R: 0, C: 0, L: 0, T: 0 };
  QUESTIONS.forEach((q, i) => {
    raw[q.area] += answers[i] ?? 0;
  });

  const byNorm = AREA_CODES.reduce<Record<AreaCode, number>>(
    (acc, code) => {
      acc[code] = Math.round((raw[code] / areaMaxFor(code)) * 100);
      return acc;
    },
    { S: 0, R: 0, C: 0, L: 0, T: 0 }
  );

  const total = Math.min(
    TOTAL_SCORE,
    AREA_CODES.reduce((sum, code) => sum + byNorm[code], 0)
  );

  return { raw, byNorm, total, grade: gradeFor(total).letter };
}

/** 문항 데이터가 승인된 구조와 맞는지 확인한다(문항 수·영역 분포·원점수 최대). */
export function auditQuestionSet() {
  const perArea = AREA_CODES.reduce<Record<AreaCode, number>>(
    (acc, c) => ({ ...acc, [c]: QUESTIONS.filter((q) => q.area === c).length }),
    { S: 0, R: 0, C: 0, L: 0, T: 0 }
  );

  const maxByArea = AREA_CODES.reduce<Record<AreaCode, number>>(
    (acc, c) => ({
      ...acc,
      [c]: QUESTIONS.filter((q) => q.area === c).reduce(
        (s, q) => s + Math.max(...q.options.map(([, v]) => v)),
        0
      ),
    }),
    { S: 0, R: 0, C: 0, L: 0, T: 0 }
  );

  return {
    count: QUESTIONS.length,
    perArea,
    maxByArea,
    declaredMax: AREA_MAX,
    memoryTests: QUESTIONS.filter((q) => q.isTest).map((q) => q.id),
    duplicateIds: QUESTIONS.map((q) => q.id).filter((id, i, arr) => arr.indexOf(id) !== i),
  };
}
