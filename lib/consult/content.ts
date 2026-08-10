import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/**
 * /consult 공간 상담 페이지 콘텐츠 SSOT.
 * 원본 fobee-space-consult.html의 문구를 그대로 옮겼다. 임의로 바꾸지 않는다.
 */

export const CONSULT_SOURCE = "space_consult";

/** 보내드리는 것 — 상담 신청 시 실제로 받게 되는 산출물. */
export const CONSULT_DELIVERABLES = [
  {
    no: "01",
    title: "3D 공간 이미지",
    desc: "가구 배치와 조명까지 반영된 실제 시점의 이미지입니다.",
  },
  {
    no: "02",
    title: "공간 활용 제안",
    desc: "동선과 좌석 배치, 주방·카운터 위치에 대한 의견을 드립니다.",
  },
  {
    no: "03",
    title: "예상 공사 범위",
    desc: "어디까지 손봐야 하는지, 어디를 살릴 수 있는지 정리해 드립니다.",
  },
];

/** 연차는 하드코딩하지 않는다(대표 결정 2026-07-31). */
export const CONSULT_CREDIBILITY = `${yearsSince(FOUNDED_YEAR)}년간 상업공간·교회·오피스·주거공간을 설계하고 직접 시공해온 회사입니다. 도면을 읽는 일과 공간을 만드는 일을 같은 사람이 합니다. 그래서 시안이 시공으로 이어질 때 달라지는 것이 적습니다.`;

export const CONSULT_STEPS = [
  {
    when: "Step 01",
    title: "도면을 보내주십니다",
    desc: "정식 도면이 아니어도 됩니다. 손그림, 부동산 평면도, 휴대폰 사진 모두 가능합니다.",
  },
  {
    when: "Step 02 · 1영업일 이내",
    title: "담당자가 연락드립니다",
    desc: "공간의 조건과 원하시는 방향을 짧게 확인합니다. 이 통화로 제작 여부가 정해집니다.",
  },
  {
    when: "Step 03 · 2~3일",
    title: "3D 시안을 보내드립니다",
    desc: "이미지와 함께 공간 활용 제안, 예상 공사 범위를 정리해 전달합니다.",
  },
  {
    when: "Step 04",
    title: "필요하시면 현장에서 뵙습니다",
    desc: "실측 후 정식 견적을 드립니다. 여기까지 비용은 없습니다.",
  },
];

export const SPACE_TYPES = [
  "카페·베이커리",
  "상업공간",
  "교회",
  "오피스",
  "교육시설",
  "주거공간",
];

export const SPACE_STATES = ["신축·공실", "기존 매장 리뉴얼", "계약 전 검토 중"];

export const CONSULT_TIMINGS = [
  "1개월 이내",
  "1~3개월",
  "3~6개월",
  "6개월 이후",
  "아직 미정",
];

/**
 * 업로드 제한 — 클라이언트와 서버가 같은 값을 본다.
 * ⚠️ 클라이언트 검증만으로는 부족하다. 서버(/api/space-consult)에서 반드시 다시 검증한다.
 */
export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export const ACCEPTED_EXT = ["jpg", "jpeg", "png", "webp", "pdf"] as const;

export const CONSULT_NOTICE =
  "3D 시안 제작은 공간 조건을 확인한 뒤 진행합니다. 도면 상태나 공간 상황에 따라 제작이 어려운 경우가 있어, 먼저 통화로 확인한 뒤 안내드립니다. 시안 제작과 현장 실측, 견적까지 비용은 없습니다.";

export const CONSULT_PRIVACY_NOTE =
  "보내주신 도면은 상담 목적으로만 사용하며 제3자에게 제공하지 않습니다.";
