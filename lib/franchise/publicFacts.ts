/**
 * 가맹 대외 노출 기준 SSOT — CLAUDE.md §0-5 표를 코드로 옮긴 것.
 *
 * 왜 코드로 옮기는가: "무엇을 공개하고 무엇을 상담에서만 말하는가"는 대표가 정한 규칙인데,
 * 문서에만 있으면 답변을 쓰는 쪽(사람이든 AI든)이 매번 기억에 의존하게 된다. 여기 한 곳에
 * 두고 참조하면 §0-2 원칙 2(없으면 없다고 한다)·원칙 3(불리해 보여도 먼저 말한다)이
 * 자동으로 지켜진다.
 *
 * ⚠️ 값을 늘리거나 고치는 권한은 대표에게만 있다. AI가 추정해 채우지 않는다(§14-A ②).
 */

import { FOUNDED_YEAR, GBRICK_FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/** 정보공개서 수치를 대외에 인용할 때 반드시 함께 붙이는 법정고지. */
export const LEGAL_NOTICE =
  "* 위 수치는 정보공개서 기준이며 실제와 차이가 있을 수 있습니다. 자세한 사항은 상담을 통해 확인해 주세요.";

export interface PublicFact {
  key: string;
  label: string;
  value: string;
  /** 불리해 보여도 먼저 말해야 하는 단서(§0-2 원칙 3). 없으면 null. */
  caveat: string | null;
  /** 이 사실을 묻는 것으로 볼 수 있는 문의 키워드. */
  keywords: string[];
  /** 정보공개서 수치라서 법정고지가 필요한가. */
  needsLegalNotice: boolean;
}

export interface RestrictedTopic {
  key: string;
  label: string;
  keywords: string[];
  /** 대외 문서에 쓰는 대신 어떻게 안내할지. */
  guide: string;
}

/**
 * 공개 항목(§0-5 왼쪽 열).
 *
 * 연차는 함수로 계산한다 — 해가 바뀌면 저절로 맞아야 하기 때문이다(§0-2 원칙 5).
 * 그래서 상수 배열이 아니라 함수다. 상수로 두면 "26년"이 2027년에도 26년으로 남는다.
 */
export function publicFacts(): PublicFact[] {
  return [
    {
      key: "career",
      label: "공간디자인 경력",
      value: `${yearsSince(FOUNDED_YEAR)}년 공간디자인 경력, ${yearsSince(GBRICK_FOUNDED_YEAR)}년 이상의 카페 운영 노하우`,
      caveat: null,
      keywords: ["경력", "연혁", "얼마나 오래", "역사", "언제부터", "노하우"],
      needsLegalNotice: false,
    },
    {
      key: "build",
      label: "설계·시공 주체",
      value: "본사가 직접 설계하고 직접 시공합니다. 외주 시공사를 두지 않습니다.",
      caveat: null,
      keywords: ["인테리어", "시공", "설계", "공사", "직영", "외주", "디자인"],
      needsLegalNotice: false,
    },
    {
      key: "cost",
      label: "창업 비용",
      value: "20평(66㎡) 기준 총 8,636만원 (임대 보증금·월세 별도)",
      caveat: "면적과 현장 조건에 따라 이보다 높을 수 있습니다.",
      keywords: ["창업비용", "비용", "얼마", "가격", "투자금", "자금", "예산", "돈"],
      needsLegalNotice: true,
    },
    {
      key: "royalty",
      label: "로열티·가맹금",
      value: "월 로열티 0원, 차액가맹금 1.65%",
      caveat: null,
      keywords: ["로열티", "가맹금", "수수료", "월회비", "본사에 내는"],
      needsLegalNotice: true,
    },
    {
      key: "contract",
      label: "계약 조건",
      value: "계약기간 2년, 가맹사업법상 갱신요구권 10년",
      caveat: null,
      keywords: ["계약", "기간", "갱신", "재계약", "몇 년"],
      needsLegalNotice: true,
    },
  ];
}

/**
 * 비공개 항목(§0-5 오른쪽 열). 물어보면 숨기는 게 아니라 "상담에서 안내한다"고 답한다.
 * 침묵이 아니라 경로 안내다 — 답을 지어내지 않으면서도 문의자를 막다른 길에 두지 않는다.
 */
export const RESTRICTED_TOPICS: RestrictedTopic[] = [
  {
    key: "storeCount",
    label: "가맹점 수",
    keywords: ["매장 수", "가맹점 수", "몇 개", "몇 곳", "점포 수", "지점"],
    guide: "수를 늘리는 것을 목표로 하지 않아 대외 수치로 안내하지 않습니다. 상담에서 현황을 직접 말씀드립니다.",
  },
  {
    key: "revenue",
    label: "평균 매출액",
    keywords: ["매출", "수익", "순이익", "월수입", "얼마나 벌", "손익"],
    guide: "매장별 편차가 커서 평균값이 오히려 오해를 만듭니다. 상담에서 상권별 실제 사례로 설명드립니다.",
  },
  {
    key: "areaCost",
    label: "면적별 실제 창업 비용",
    keywords: ["30평", "40평", "50평", "평수별", "면적별"],
    guide: "정보공개서 기준 20평 금액만 공개합니다. 다른 면적은 현장 실측 후 상담에서 안내합니다.",
  },
  {
    key: "closed",
    label: "폐점 매장 및 사유",
    keywords: ["폐점", "문 닫", "망한", "실패", "그만둔"],
    guide: "종료된 매장이 있습니다. 사유는 상담에서 있는 그대로 말씀드립니다.",
  },
];
