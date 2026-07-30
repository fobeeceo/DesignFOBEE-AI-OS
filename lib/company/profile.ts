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

export const MILESTONES = [
  { year: "2000", title: "디자인포비 설립", desc: "공간디자인 전문기업으로 법인 설립" },
  { year: "2009", title: "실내건축공사업 등록", desc: "설계부터 시공까지 직접 책임지는 면허 취득" },
  { year: "2013", title: "GBRICK Coffee 런칭", desc: "공간 철학을 담은 브랜드로 확장" },
  { year: "2026", title: "AI 공간 설계 도입", desc: "26년의 경험을 AI 분석·제안으로 연결" },
];

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
 */
export const STATS = [
  { value: "26년", label: "공간을 만들어온 시간" },
  { value: "직접 설계·시공", label: "One Stop Service" },
  { value: "AI 기반 설계", label: "Design AI" },
  { value: "10년+", label: "운영 노하우" },
];
