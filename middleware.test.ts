import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// process.env를 스텁 — middleware 함수 내에서 읽으므로 정적 import 후 스텁해도 유효
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.fobee.co.kr');

function makeReq(url: string, host: string): NextRequest {
  return new NextRequest(new URL(url), { headers: { host } });
}

describe('middleware — brand domain routing (brandDomain.ts 연결 검증)', () => {
  it('gbrickcoffee.com / → x-middleware-rewrite: /franchise (주소창 유지)', async () => {
    const res = await middleware(makeReq('http://www.gbrickcoffee.com/', 'www.gbrickcoffee.com'));
    const rewrite = res.headers.get('x-middleware-rewrite');
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite!).pathname).toBe('/franchise');
    expect(res.status).toBe(200);
  });

  it('gbrickcoffee.com /design → 307 redirect to fobee.co.kr/design', async () => {
    const res = await middleware(makeReq('http://www.gbrickcoffee.com/design', 'www.gbrickcoffee.com'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('fobee.co.kr/design');
  });

  it('gbrickcoffee.com /franchise → pass (redirect 없음, rewrite 없음)', async () => {
    const res = await middleware(makeReq('http://www.gbrickcoffee.com/franchise', 'www.gbrickcoffee.com'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.status).not.toBe(307);
    expect(res.headers.get('location')).toBeNull();
  });

  it('gbrickcoffee.co.kr / → rewrite (한국 도메인도 처리)', async () => {
    const res = await middleware(makeReq('http://gbrickcoffee.co.kr/', 'gbrickcoffee.co.kr'));
    const rewrite = res.headers.get('x-middleware-rewrite');
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite!).pathname).toBe('/franchise');
  });

  it('gbrickcoffee.com /design?utm_source=instagram → 쿼리스트링 손실 없음', async () => {
    const res = await middleware(makeReq('http://www.gbrickcoffee.com/design?utm_source=instagram', 'www.gbrickcoffee.com'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('fobee.co.kr/design');
    expect(location).toContain('utm_source=instagram');
  });

  it('fobee.co.kr → brand routing 없음 (기존 동작 유지)', async () => {
    const res = await middleware(makeReq('http://www.fobee.co.kr/', 'www.fobee.co.kr'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.status).not.toBe(307);
  });
});
