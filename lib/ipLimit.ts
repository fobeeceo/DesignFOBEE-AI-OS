import { NextRequest } from 'next/server';
import { DAILY_IP_LIMIT } from '@/lib/constants';

/**
 * IP당 일일 데모 사용 제한 — /api/generate, /api/refine이 공유한다.
 * 인메모리 맵이라 서버 인스턴스가 재시작/스케일아웃되면 초기화된다(기존 generate 라우트의 한계 그대로 유지).
 */
const ipLimits = new Map<string, { count: number; resetAt: number }>();

export function getIpUsage(ip: string): { allowed: boolean } {
  const now = Date.now();
  const limit = ipLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    ipLimits.set(ip, { count: 0, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true };
  }

  return { allowed: limit.count < DAILY_IP_LIMIT };
}

export function consumeIpUsage(ip: string) {
  const limit = ipLimits.get(ip);
  if (limit) limit.count += 1;
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}
