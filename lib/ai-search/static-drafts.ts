/**
 * GBRICK Coffee AI 검색 개선 콘텐츠 초안 (정적 데이터)
 * §0-2 원칙 2: 실제 자료가 없으면 AI가 생성하지 않는다.
 *
 * - factChecked: false — 대표 사실 확인 전 외부 게시 불가
 * - status: 'AWAITING_CEO' — 대표 검토 후 다음 단계 결정
 * - factCheckItems: 대표가 확인해야 할 항목 목록
 *
 * 가격·정확한 주소·영업시간은 의도적으로 제외하고 [확인 필요] 태그로 표시.
 * 대표 검토 시 실제 값으로 교체 후 factChecked: true 처리.
 */

import type { ContentDraft } from './content-drafts';

export const GBRICK_STATIC_DRAFTS: ContentDraft[] = [
  {
    id: 'gbrick-draft-01-naver',
    businessId: 'gbrick-coffee',
    improvementTaskId: 'gbrick-imp-01',
    targetQuestionCode: 'Q01',
    platform: 'NAVER_BLOG',
    title: '은평뉴타운 카페 추천 — 공간이 다른 GBRICK Coffee',
    body: `# 은평뉴타운 카페 추천 — GBRICK Coffee를 소개합니다

은평뉴타운에서 카페를 고를 때 저는 늘 두 가지를 봅니다. 커피의 퀄리티, 그리고 오래 앉아 있고 싶은 공간.

GBRICK Coffee는 이 두 가지를 모두 충족하는 카페입니다.

## 위치

[확인 필요: 정확한 주소 및 지하철 출구 정보]

## 공간 특징

GBRICK Coffee는 공간 디자인 전문기업 디자인포비가 직접 설계한 카페입니다. 일반 카페와 달리, 공간 자체가 브랜드의 일부로 설계되었습니다.

유리 인테리어를 활용한 개방감, 대화하기 편한 좌석 배치가 특징입니다.

## 메뉴

시그니처 음료부터 디저트까지 다양하게 준비되어 있습니다.
[확인 필요: 대표 메뉴 이름 및 가격대]

계절 메뉴도 준비되어 있으니 방문 전 확인을 추천합니다.

## 영업시간

[확인 필요: 영업시간 및 정기 휴무일]

## 방문 후기

은평뉴타운에서 조용히 시간을 보내고 싶을 때, 소규모 모임 장소가 필요할 때 GBRICK Coffee를 추천합니다.

#은평뉴타운카페 #은평뉴타운카페추천 #GBRICK커피 #지브릭커피 #은평구카페`,
    keywords: [
      '은평뉴타운 카페',
      '은평뉴타운 카페 추천',
      'GBRICK Coffee',
      '지브릭커피',
      '은평구 카페',
    ],
    status: 'AWAITING_CEO',
    factChecked: false,
    factCheckItems: [
      '정확한 주소 및 지하철 출구 정보 확인',
      '대표 메뉴 이름 및 가격대 확인',
      '현재 영업시간 및 정기 휴무일 확인',
      '브랜드 톤 및 표현 방식 검토',
    ],
    createdAt: '2026-10-25',
    updatedAt: '2026-10-25',
  },
  {
    id: 'gbrick-draft-01-gbp',
    businessId: 'gbrick-coffee',
    improvementTaskId: 'gbrick-imp-01',
    targetQuestionCode: 'Q01',
    platform: 'GOOGLE_BUSINESS',
    title: 'Google Business Profile — 카페 설명 업데이트 초안',
    body: `GBRICK Coffee는 공간 디자인 전문기업 디자인포비가 직접 설계·운영하는 카페입니다.

은평뉴타운에 위치하며, 유리 인테리어와 개방감 있는 공간 설계가 특징입니다. 대화하기 편한 좌석 배치로 소규모 모임과 1인 방문 모두에 적합합니다.

시그니처 음료, 계절 메뉴, 디저트를 제공합니다.

[확인 필요: 영업시간 / 정기 휴무일 / 주차 여부]`,
    keywords: [
      '은평뉴타운 카페',
      '공간 디자인 카페',
      '조용한 카페',
      '소규모 모임',
    ],
    status: 'AWAITING_CEO',
    factChecked: false,
    factCheckItems: [
      '영업시간 및 정기 휴무일 확인',
      '주차 가능 여부 확인',
      'Google Business Profile 현재 설명과 비교 후 교체 여부 결정',
    ],
    createdAt: '2026-10-25',
    updatedAt: '2026-10-25',
  },
  {
    id: 'gbrick-draft-02-instagram',
    businessId: 'gbrick-coffee',
    improvementTaskId: 'gbrick-imp-02',
    targetQuestionCode: 'Q13',
    platform: 'INSTAGRAM',
    title: '공간 특징 소개 — 인스타그램 캡션 초안',
    body: `조용히 앉아 시간을 보내고 싶을 때 찾는 공간이 있나요? 🤍

GBRICK Coffee는 공간 디자이너가 설계한 카페입니다.
유리 인테리어가 만드는 개방감, 자연광이 가득한 실내.

대화에 집중할 수 있는 공간. 소규모 모임에도 좋은 공간.

[확인 필요: 해시태그 방향 — 지역 기반 vs 분위기 기반]

#GBRICK커피 #지브릭커피 #은평뉴타운카페 #카페인테리어 #공간디자인카페 #조용한카페 #대화하기좋은카페 #소규모모임장소`,
    keywords: [
      '유리 인테리어 카페',
      '조용한 카페',
      '대화하기 좋은 카페',
      '소규모 모임',
      '공간 디자인 카페',
    ],
    status: 'AWAITING_CEO',
    factChecked: false,
    factCheckItems: [
      '인스타그램 이미지 확보 여부 확인 (유리 인테리어 사진)',
      '해시태그 방향 결정 (지역 기반 우선 vs 분위기 기반 우선)',
      '브랜드 보이스 — 이모지 사용 방침 확인',
    ],
    createdAt: '2026-10-25',
    updatedAt: '2026-10-25',
  },
];
