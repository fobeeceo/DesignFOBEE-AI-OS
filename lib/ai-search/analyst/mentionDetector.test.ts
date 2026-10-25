import { describe, expect, it } from 'vitest';
import { detectMention, findFirstMentionIndex } from './mentionDetector';

describe('detectMention', () => {
  it('한국어 브랜드명 언급 감지', () => {
    const result = detectMention('은평구 카페 중에 지브릭커피가 유명합니다.');
    expect(result.status).toBe('MENTIONED');
    expect(result.evidence).toContain('지브릭커피');
  });

  it('영문 브랜드명 언급 감지 (대소문자 무시)', () => {
    const result = detectMention('In Eunpyeong, gbrick coffee is well known.');
    expect(result.status).toBe('MENTIONED');
  });

  it('정확한 영문 대소문자로 언급 감지', () => {
    const result = detectMention('GBRICK Coffee는 은평뉴타운에 위치한 카페입니다.');
    expect(result.status).toBe('MENTIONED');
    expect(result.evidence).toContain('GBRICK Coffee');
  });

  it('한국어 공백 변형 언급 감지 (지브릭 커피)', () => {
    // 실측 Q16에서 "지브릭커피" 대신 "지브릭 커피(G.BRICK COFFEE)"가 나타나 미감지된 케이스
    const result = detectMention('**지브릭 커피(G.BRICK COFFEE)**는 서울 은평뉴타운에 본점을 두고 있습니다.');
    expect(result.status).toBe('MENTIONED');
    expect(result.evidence).toContain('지브릭 커피');
  });

  it('영문 점·대문자 변형 언급 감지 (G.BRICK COFFEE)', () => {
    const result = detectMention('G.BRICK COFFEE는 공간 디자인 전문 카페입니다.');
    expect(result.status).toBe('MENTIONED');
  });

  it('G.BRICK COFFEE 대소문자 무시', () => {
    const result = detectMention('g.brick coffee 브랜드 소개');
    expect(result.status).toBe('MENTIONED');
  });

  it('브랜드 언급 없음', () => {
    const result = detectMention('은평구에는 다양한 카페가 있습니다. 커피빈, 스타벅스 등이 있습니다.');
    expect(result.status).toBe('NOT_MENTIONED');
    expect(result.evidence).toBeUndefined();
  });

  it('빈 텍스트는 FAILED', () => {
    expect(detectMention('').status).toBe('FAILED');
    expect(detectMention('   ').status).toBe('FAILED');
  });

  it('FAILED는 NOT_MENTIONED가 아니다', () => {
    const result = detectMention('');
    expect(result.status).not.toBe('NOT_MENTIONED');
    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBeTruthy();
  });

  it('evidence 스니펫은 전체 텍스트가 아니다', () => {
    const long = 'x'.repeat(200) + 'GBRICK Coffee' + 'y'.repeat(200);
    const result = detectMention(long);
    expect(result.status).toBe('MENTIONED');
    expect(result.evidence!.length).toBeLessThan(long.length);
  });
});

describe('findFirstMentionIndex', () => {
  it('한국어 브랜드 위치 반환', () => {
    const idx = findFirstMentionIndex('안녕하세요. 지브릭커피 추천합니다.');
    expect(idx).not.toBeNull();
    expect(idx).toBeGreaterThan(0);
  });

  it('언급 없으면 null', () => {
    expect(findFirstMentionIndex('스타벅스 추천')).toBeNull();
  });
});
