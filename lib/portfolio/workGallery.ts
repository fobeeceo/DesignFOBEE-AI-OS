/**
 * "우리 작업" 갤러리 데이터.
 * 출처: Google Drive GBRICK FRANCHISE SYSTEM/디자인포비작업사진(2026-07-27 CEO 제공) +
 * 디자인포비작업사진2(2026-07-29 CEO 추가 제공).
 * 파일명에 프로젝트명·매장명·연도 메타데이터가 없어 특정 지점명은 표기하지 않는다(추측 금지) —
 * 사진에서 실제로 확인되는 공간 용도만 카테고리/설명으로 기록한다.
 * 2026-07-29 배치는 교회 시설 사진이 다수 포함되어 있었으나, 예배/모임 중 촬영되어 참석자
 * 얼굴이 식별 가능한 사진은 동의 확인 전까지 제외했다(부속 키즈공간 등 사람이 없는 사진만 포함).
 */
export type WorkItem = {
  slug: string;
  category: string;
  caption: string;
  span?: "wide" | "tall";
};

export const WORK_GALLERY: WorkItem[] = [
  {
    slug: "designfobee-storefront-exterior-01",
    category: "상업공간 · 외관",
    caption: "야간 조명 디자인이 돋보이는 매장 외관",
    span: "wide",
  },
  {
    slug: "designfobee-retail-vmd-01",
    category: "리테일 · VMD",
    caption: "백화점 리테일 진열 공간",
  },
  {
    slug: "designfobee-bathroom-tile-01",
    category: "상업공간 · 부대시설",
    caption: "모자이크 타일 화장실",
  },
  {
    slug: "designfobee-cafe-kiosk-01",
    category: "리테일 · 브랜드관",
    caption: "브랜드 키오스크 인테리어",
  },
  {
    slug: "designfobee-lounge-furniture-01",
    category: "카페 · 라운지",
    caption: "우드톤 라운지 공간",
    span: "tall",
  },
  {
    slug: "designfobee-retail-bedding-01",
    category: "리테일 · 브랜드관",
    caption: "홈텍스타일 브랜드 매장",
  },
  {
    slug: "designfobee-office-01",
    category: "오피스",
    caption: "오피스 인테리어",
  },
  {
    slug: "designfobee-meeting-room-01",
    category: "오피스 · 회의공간",
    caption: "컬러 포인트 회의실",
  },
  {
    slug: "designfobee-cafe-interior-01",
    category: "카페 · F&B",
    caption: "갤러리형 카페 공간",
  },
  {
    slug: "designfobee-office-02",
    category: "오피스",
    caption: "스톤 월과 우드 마감의 오피스",
  },
  {
    slug: "designfobee-retail-clothing-01",
    category: "리테일 · 브랜드관",
    caption: "컬러 포인트 의류 매장",
  },
  {
    slug: "designfobee-cafe-lounge-02",
    category: "카페 · 라운지",
    caption: "체크 패턴 라운지 좌석",
  },
  {
    slug: "designfobee-cafe-lounge-03",
    category: "카페 · 라운지",
    caption: "우드톤 카페 좌석 공간",
  },
  {
    slug: "designfobee-cafe-lounge-04",
    category: "카페 · 라운지",
    caption: "벨벳 소파 라운지 공간",
  },
  {
    slug: "designfobee-office-lounge-01",
    category: "오피스",
    caption: "컬러 포인트 오피스 라운지",
  },
  {
    slug: "designfobee-cafe-reading-01",
    category: "카페 · F&B",
    caption: "그린 인테리어의 북카페형 공간",
  },
  {
    slug: "designfobee-cafe-counter-shelving-01",
    category: "카페 · GBRICK Coffee",
    caption: "GBRICK Coffee 은평본점 — 곡선형 원두·매대 진열장",
  },
  {
    slug: "designfobee-cafe-bakery-counter-01",
    category: "카페 · GBRICK Coffee",
    caption: "GBRICK Coffee 은평본점 — 베이커리 쇼케이스 + 에스프레소 바",
  },
  {
    slug: "designfobee-retail-corridor-01",
    category: "상업공간 · 기타",
    caption: "글라스월 복도 · 무인 키오스크 공간",
  },
  {
    slug: "designfobee-kids-lounge-01",
    category: "교회 · 부속공간",
    caption: "키즈 라운지(교회 부속시설)",
  },
  {
    slug: "designfobee-kids-lounge-02",
    category: "교회 · 부속공간",
    caption: "키즈 라운지 2(교회 부속시설)",
  },
];
