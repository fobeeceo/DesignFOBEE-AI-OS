import { describe, expect, it } from 'vitest';
import { canPublish } from './content-drafts';
import type { ContentDraft } from './content-drafts';

function makeDraft(
  status: ContentDraft['status'],
  factChecked: boolean,
): ContentDraft {
  return {
    id: 'test-draft',
    businessId: 'gbrick-coffee',
    improvementTaskId: 'gbrick-imp-01',
    targetQuestionCode: 'Q01',
    platform: 'NAVER_BLOG',
    title: '은평뉴타운 카페 추천',
    body: '지브릭커피는...',
    keywords: ['은평뉴타운', '카페'],
    status,
    factChecked,
    createdAt: '2026-10-24',
    updatedAt: '2026-10-24',
  };
}

describe('canPublish — CEO 승인 전 게시 불가 (§0-2 원칙 2·3)', () => {
  it('APPROVED + factChecked=true → 게시 가능', () => {
    expect(canPublish(makeDraft('APPROVED', true))).toBe(true);
  });

  it('APPROVED이지만 factChecked=false → 게시 불가', () => {
    expect(canPublish(makeDraft('APPROVED', false))).toBe(false);
  });

  it('factChecked=true이지만 DRAFT 상태 → 게시 불가', () => {
    expect(canPublish(makeDraft('DRAFT', true))).toBe(false);
  });

  it('AWAITING_CEO + factChecked=true → 게시 불가', () => {
    expect(canPublish(makeDraft('AWAITING_CEO', true))).toBe(false);
  });

  it('CEO_APPROVED + factChecked=true → 아직 게시 불가 (고객 확인 전)', () => {
    expect(canPublish(makeDraft('CEO_APPROVED', true))).toBe(false);
  });

  it('AWAITING_CUSTOMER + factChecked=true → 게시 불가', () => {
    expect(canPublish(makeDraft('AWAITING_CUSTOMER', true))).toBe(false);
  });

  it('PUBLISHED → 이미 게시됨 (canPublish false — 추가 게시 필요 없음)', () => {
    expect(canPublish(makeDraft('PUBLISHED', true))).toBe(false);
  });

  it('REJECTED → 게시 불가', () => {
    expect(canPublish(makeDraft('REJECTED', true))).toBe(false);
  });

  it('APPROVED + factChecked=false → 승인됐어도 사실 미확인이면 불가', () => {
    // 없는 내용을 만들어 게시하지 않는다 (§0-2 원칙 2)
    const draft = makeDraft('APPROVED', false);
    expect(canPublish(draft)).toBe(false);
  });
});
