/**
 * "우리 작업" 갤러리 데이터.
 * 출처: Google Drive GBRICK FRANCHISE SYSTEM/디자인포비작업사진(2026-07-27 CEO 제공).
 * 파일명에 프로젝트명·매장명·연도 메타데이터가 없어 특정 지점명은 표기하지 않는다(추측 금지) —
 * 사진에서 실제로 확인되는 공간 용도만 카테고리/설명으로 기록한다.
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
];
