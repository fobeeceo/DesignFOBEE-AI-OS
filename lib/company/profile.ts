/**
 * 디자인포비 회사 프로필 — 홈 AboutSection·ServicesSection·/about 페이지가 공유하는 SSOT.
 * 출처: 사업자등록증·전문건설업 등록증(2000/2009), 지명원 연혁(2013), Footer 사업자 정보.
 */
export const COMPANY = {
  name: "주식회사 디자인포비",
  ceo: "이대성",
  founded: "2000.10.27",
  phone: "02-517-1474",
  email: "ceo@fobee.co.kr",
};

/** 창업 연도(2000). founded 문자열에서 파생해 한 곳에서만 관리한다. */
export const FOUNDED_YEAR = Number(COMPANY.founded.slice(0, 4));
/** 실내건축공사업 등록(설계·시공 직접 수행 시작) 연도. */
export const LICENSE_YEAR = 2009;

/**
 * 경과 연차 계산 — 대표 결정(2026-07-31) "모든 신뢰 지표는 자동 계산, 하드코딩 금지".
 * 해가 바뀌면 화면 숫자가 저절로 맞춰지므로 사람이 관리할 필요가 없다.
 */
export function yearsSince(year: number): number {
  return new Date().getFullYear() - year;
}

export const MILESTONES = [
  { year: "2000", title: "디자인포비 설립", desc: "공간디자인 전문기업으로 법인 설립" },
  { year: "2009", title: "실내건축공사업 등록", desc: "설계부터 시공까지 직접 책임지는 면허 취득" },
  { year: "2013", title: "GBRICK Coffee 런칭", desc: "공간 철학을 담은 브랜드로 확장" },
  {
    year: "2026",
    title: "AI 공간 설계 도입",
    desc: `${yearsSince(FOUNDED_YEAR)}년의 경험을 AI 분석·제안으로 연결`,
  },
];

/**
 * 대표 소개 — CEO 업무지시(홈페이지 신뢰도 강화 Priority 3)에서 대표님이 직접 제시한
 * 항목만 기록한다. 학력·수상·직함 등 확인되지 않은 개인 정보는 추가하지 않는다.
 * 대표 사진은 보유 자산이 없고 스톡 이미지 사용이 금지되어 있어 텍스트로만 구성한다.
 */
export const CEO_PROFILE = {
  name: COMPANY.ceo,
  title: "대표이사",
  intro: `${FOUNDED_YEAR}년 디자인포비를 창업해 ${yearsSince(FOUNDED_YEAR)}년간 공간을 직접 설계하고 시공해왔습니다. 도면을 그리는 일에서 끝내지 않고, 현장에서 마감까지 확인하는 방식으로 일해왔습니다.`,
  careers: [
    { label: "2000년 창업", desc: "공간디자인 전문기업 디자인포비 설립" },
    { label: "설계·시공 직접 수행", desc: "2009년 실내건축공사업 등록 — 외주 없이 본사가 직접 책임" },
    { label: "교회 인테리어 전문", desc: "예배공간과 부속시설 설계·시공" },
    { label: "상업공간 브랜드 구축", desc: "매장·리테일·오피스 공간 브랜딩" },
    { label: "GBRICK Coffee 개발", desc: "2013년 공간 중심 카페 브랜드 런칭" },
    {
      label: "AI 기반 설계 시스템",
      desc: `${yearsSince(FOUNDED_YEAR)}년의 경험을 AI 분석·제안으로 연결`,
    },
  ],
};

export const SERVICES = [
  { title: "상업공간", desc: "브랜드 경험을 담은 매장·상업 공간 디자인" },
  { title: "교회", desc: "공동체의 가치를 담은 예배 공간 설계" },
  { title: "교육시설", desc: "배움에 몰입하는 학습 환경 조성" },
  { title: "오피스", desc: "일하는 방식을 바꾸는 업무 공간 설계" },
  { title: "주거공간", desc: "삶의 질을 높이는 주거 공간 디자인" },
];

/**
 * 신뢰지표(Statistics) — CEO 업무지시(홈페이지 신뢰지표 개선): 매장 수·폐점 수처럼
 * 시간이 지나며 바뀌는 숫자는 유지보수 부담과 신뢰도 저하 우려로 제외하고,
 * 변하지 않는 지표만 사용한다. 대표 승인 없이 새 통계 숫자를 추가하지 않는다.
 *
 * 연차는 하드코딩하지 않고 창업 연도에서 계산한다 — 대표 결정(2026-07-31)
 * "모든 신뢰 지표는 자동 계산을 기본으로 한다. 하드코딩 금지."
 */
export function getStats() {
  return [
    { value: `${yearsSince(FOUNDED_YEAR)}년`, label: "공간을 만들어온 시간" },
    { value: "직접 설계·시공", label: "One Stop Service" },
    { value: "AI 기반 설계", label: "Design AI" },
    { value: "10년+", label: "운영 노하우" },
  ];
}
