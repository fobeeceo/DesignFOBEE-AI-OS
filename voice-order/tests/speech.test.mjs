// 이어 듣기 조각 합치기 · 한국어 목소리 고르기 (frontend/speech.js — 브라우저 없이 시험할 수 있는 부분)
import test from 'node:test';
import assert from 'node:assert/strict';
import { joinSegments, pickKoreanVoice } from '../frontend/speech.js';

test('이어 듣기: 말 중간에 쉬어도 한 문장으로 합친다', () => {
  assert.equal(joinSegments(['아이스 아메리카노', ' 두 잔 주세요']), '아이스 아메리카노 두 잔 주세요');
});

test('이어 듣기: 앞 내용을 다시 붙여 보내는 기기(안드로이드)에서도 겹치지 않는다', () => {
  assert.equal(joinSegments(['아이스', '아이스 아메리카노', '아이스 아메리카노 두 잔']), '아이스 아메리카노 두 잔');
  assert.equal(joinSegments(['라떼 하나', '라떼 하나']), '라떼 하나');
  assert.equal(joinSegments(['', '  ']), '');
});

test('목소리: 고음질 한국어 → Google → 기본 한국어 순, 한국어가 없으면 null', () => {
  const v = (name, lang = 'ko-KR') => ({ name, lang });
  assert.equal(pickKoreanVoice([v('Microsoft Heami'), v('Google 한국의'), v('Samantha', 'en-US')]).name, 'Google 한국의');
  assert.equal(pickKoreanVoice([v('Google 한국의'), v('Microsoft SunHi Online (Natural)')]).name, 'Microsoft SunHi Online (Natural)');
  assert.equal(pickKoreanVoice([v('Yuna'), v('Kyoko', 'ja-JP')]).name, 'Yuna');
  assert.equal(pickKoreanVoice([v('Samantha', 'en-US')]), null);
});
