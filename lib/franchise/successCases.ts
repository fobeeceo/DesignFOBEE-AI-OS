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
  },
  {
    code: "SUCCESS-002",
    title: "본사 직접 설계·시공으로 확장한 가맹점",
    category: "입지성공",
    location: "경기 안산시 · 안산점",
    summary:
      "외주 인테리어 업체를 거치지 않고 본사가 설계부터 시공까지 직접 담당했습니다. 상권 특성에 맞춘 공간 구성을 본사가 일관되게 책임집니다.",
    image: "/images/portfolio/gbrick-ansan.jpg",
  },
  {
    code: "SUCCESS-003",
    title: "장기 운영으로 이어진 매장",
    category: "운영성공",
    location: "경기 성남시 · 단대점",
    summary:
      "2013년 오픈 이후 장기간 운영을 이어오고 있는 매장입니다. 유행을 따라가는 인테리어가 아닌, 오래 유지되는 공간 설계를 지향합니다.",
    image: "/images/portfolio/gbrick-dandae.jpg",
  },
];

/**
 * 성공사례 조회 — 추후 09_성공사례DB / DB 연동 시 이 함수만 async 데이터 소스로 교체한다.
 * (호출부는 배열만 사용하므로 시그니처 변경 없이 전환 가능)
 */
export function getSuccessCases(): SuccessCase[] {
  return SUCCESS_CASES;
}
