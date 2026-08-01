/**
 * 가맹 성공사례 데이터.
 *
 * 현재는 정적 Mock 데이터이며, 추후 Google Drive `09_성공사례DB`(SUCCESS-XXX 문서) 또는
 * DB 테이블로 교체할 수 있도록 `getSuccessCases()` 한 곳만 바꾸면 되는 구조로 둔다.
 * 필드명은 09_성공사례DB의 SUCCESS_CASE_TEMPLATE.md 항목(사례번호·제목·구분·상황·결과·
 * 한 줄 교훈)과 대응시켰다.
 *
 * ⚠️ 원칙: 검증되지 않은 매출·수익 수치나 가상의 점주 인터뷰·후기는 넣지 않는다.
 * 아래 내용은 지명원·정보공개서로 확인된 실제 매장 확장 사실만 기술한 것이다.
 * 실제 인터뷰·수치가 확보되면 `quote`/`metrics` 등의 필드를 추가해 보강한다.
 */
export type SuccessCase = {
  /** 09_성공사례DB의 사례번호(SUCCESS-XXX)와 매핑 예정 */
  code: string;
  title: string;
  category: string;
  location: string;
  summary: string;
  image: string;
  /** 상담 태그(leadIntelligence.classifyLead 결과)와 매칭해 추천에 사용한다. */
  tags: string[];
  /**
   * 노출 중단 사례. 폐점 등으로 더 이상 사실이 아닌 사례를 데이터는 남긴 채 감출 때 쓴다.
   * 목록·추천에서 빠지지만 getCasesByCodes()로는 계속 조회된다 —
   * 이미 이 코드가 저장된 과거 상담 기록이 관리자 화면에서 깨지면 안 되기 때문이다.
   */
  hidden?: boolean;
};

const SUCCESS_CASES: SuccessCase[] = [
  {
    code: "SUCCESS-001",
    title: "직영 1호점에서 검증한 공간 중심 매장 모델",
    category: "창업성공",
    location: "서울 은평구 · 은평본점",
    summary:
      "2013년 직영 1호점으로 시작해 공간 자체가 브랜드가 되는 매장 모델을 직접 운영하며 검증했습니다. 이후 모든 가맹점 설계의 기준이 되는 매장입니다.",
    image: "/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp",
    tags: ["신규창업", "카페", "가맹문의"],
  },
  {
    code: "SUCCESS-002",
    title: "본사 직접 설계·시공으로 확장한 가맹점",
    category: "입지성공",
    location: "경기 안산시 · 안산점",
    summary:
      "외주 인테리어 업체를 거치지 않고 본사가 설계부터 시공까지 직접 담당했습니다. 상권 특성에 맞춘 공간 구성을 본사가 일관되게 책임집니다.",
    image: "/images/portfolio/gbrick-ansan.jpg",
    tags: ["상권분석", "인테리어", "신규창업"],
    // 폐점 매장 — 노출 중단(2026-08-01 대표 지시).
    // 사유: 2019년 양도 후 브랜드 이탈. 현재 같은 자리에서 다른 간판으로 영업 중이다.
    // (신길점과 동일 매장이다.) 시공 사실은 포트폴리오에 남기되, 가맹 성공사례로는 쓰지 않는다.
    hidden: true,
  },
  {
    code: "SUCCESS-003",
    title: "장기 운영으로 이어진 매장",
    category: "운영성공",
    location: "경기 성남시 · 단대점",
    summary:
      "2013년 오픈 이후 장기간 운영을 이어오고 있는 매장입니다. 유행을 따라가는 인테리어가 아닌, 오래 유지되는 공간 설계를 지향합니다.",
    image: "/images/portfolio/gbrick-dandae.jpg",
    tags: ["업종변경", "투자문의", "카페"],
    // 폐점 매장 — 노출 중단(2026-08-01 대표 지시).
    // 사유: 2013년 오픈 → 2023년 승계 → 2024년 폐점(승계 실패).
    // "운영성공"·"운영을 이어오고 있는"은 현재 사실과 다르다. 다시 노출하려면 문구부터 고쳐야 한다.
    hidden: true,
  },
  {
    code: "SUCCESS-004",
    title: "교회 공간 설계·시공 사례",
    category: "공간전문성",
    location: "교회 예배공간 · 부속 키즈라운지",
    summary:
      "예배공간과 부속 시설을 직접 설계·시공했습니다. 교회 카페·부속공간을 검토 중이시라면 상담 시 관련 사례를 함께 안내드립니다.",
    image: "/images/portfolio/website/designfobee-kids-lounge-01.webp",
    tags: ["교회카페", "인테리어"],
  },
];

/** 태그 매칭 없이도 항상 보여줄 기본 추천 사례(직영 1호점). */
const DEFAULT_CASE_CODE = "SUCCESS-001";

/**
 * 상담 태그 기반 성공사례 추천 (CEO 업무지시 6번).
 * 교회 → 교회 사례 / 카페·신규창업 → GBRICK 매장 사례 / 업종변경 → 관련 사례.
 * 매칭 결과가 없으면 직영 1호점 사례를 기본으로 안내한다.
 */
export function recommendCases(tags: string[], limit = 2): SuccessCase[] {
  const scored = getSuccessCases().map((item) => ({
    item,
    matches: item.tags.filter((tag) => tags.includes(tag)).length,
  }))
    .filter((entry) => entry.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map((entry) => entry.item);

  if (scored.length === 0) {
    const fallback = SUCCESS_CASES.find((item) => item.code === DEFAULT_CASE_CODE);
    return fallback ? [fallback] : [];
  }

  return scored.slice(0, limit);
}

/** 추천 결과를 Lead에 저장할 때 쓰는 코드 배열 형태. */
export function recommendCaseCodes(tags: string[], limit = 2): string[] {
  return recommendCases(tags, limit).map((item) => item.code);
}

/** 저장된 사례 코드로 다시 사례 객체를 조회한다(관리자 화면 표시용). */
export function getCasesByCodes(codes: string[]): SuccessCase[] {
  return codes
    .map((code) => SUCCESS_CASES.find((item) => item.code === code))
    .filter((item): item is SuccessCase => Boolean(item));
}

/**
 * 노출용 성공사례 조회 — hidden 사례는 제외한다.
 * 추후 09_성공사례DB / DB 연동 시 이 함수만 async 데이터 소스로 교체한다.
 * (호출부는 배열만 사용하므로 시그니처 변경 없이 전환 가능)
 */
export function getSuccessCases(): SuccessCase[] {
  return SUCCESS_CASES.filter((item) => !item.hidden);
}
