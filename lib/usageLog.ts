import { prisma } from '@/lib/prisma';

/**
 * 공개 AI 스튜디오(/design, 로그인 없음)의 실사용 로그를 남긴다.
 * 베스트에포트 — DB 기록 실패가 사용자 응답을 막으면 안 되므로 await하지 않고 에러만 로깅한다.
 * (§0-6 원칙: 보조 기능의 실패가 핵심 기능을 막지 않는다)
 */
export function logPublicGeneration(source: 'generate' | 'refine', byok: boolean) {
  prisma.publicGeneration.create({ data: { source, byok } }).catch((err) => {
    console.error('[logPublicGeneration]', err);
  });
}
