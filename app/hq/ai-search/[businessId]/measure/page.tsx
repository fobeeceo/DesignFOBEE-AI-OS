import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import { QUESTIONS } from '@/lib/ai-search/questions';
import { MeasurementForm } from '@/components/ai-search/MeasurementForm';

export const metadata: Metadata = {
  title: '측정 입력 — AI 검색 진단',
  robots: { index: false, follow: false },
};

interface Props {
  params: { businessId: string };
}

export default function MeasurePage({ params }: Props) {
  const _biz = DEMO_BUSINESSES.find((b) => b.id === params.businessId);
  if (!_biz) notFound();
  const biz = _biz!;

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <Link
          href={`/hq/ai-search/${biz.id}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {biz.name} 진단 결과
        </Link>
        <h1 className="mt-1 text-xl font-bold">측정 입력</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          ChatGPT · Gemini 등 AI 서비스에 직접 질문하고 결과를 기록합니다.
        </p>
      </div>

      <MeasurementForm
        businessId={biz.id}
        businessName={biz.name}
        questions={QUESTIONS}
      />
    </div>
  );
}
