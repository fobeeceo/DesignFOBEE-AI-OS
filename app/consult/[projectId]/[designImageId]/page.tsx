import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDesignImageWithEstimate } from "@/services/designService";
import { ConsultRequestForm } from "@/components/design/ConsultRequestForm";
import { ROOM_TYPES, STYLES } from "@/prompts/interiorStyles";

interface PageProps {
  params: { projectId: string; designImageId: string };
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/**
 * STEP 8: 상담 신청 화면.
 * AI 디자인 스튜디오(STEP 4~7) 결과(이미지+설명+견적)를 요약해서 보여주고,
 * 그 결과를 첨부한 상담 신청 폼을 제공한다.
 */
export default async function ConsultPage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const design = await getDesignImageWithEstimate(params.designImageId, user.id);
  if (!design || design.projectId !== params.projectId) {
    redirect("/upload");
  }

  const roomLabel = ROOM_TYPES.find((r) => r.id === design.roomType)?.label ?? design.roomType;
  const styleLabel = STYLES.find((s) => s.id === design.style)?.label ?? design.style;

  return (
    <div className="container-px mx-auto max-w-4xl py-10">
      <div className="mb-8 text-center">
        <span className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-foreground">
          Consult Request
        </span>
        <h1 className="mt-4 text-2xl font-bold">AI 디자인 결과로 상담 신청하기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          아래 AI 디자인 결과가 담당자에게 함께 전달됩니다.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={design.url} alt="AI 리디자인 결과" className="w-full object-cover" />
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">{roomLabel}</span>
            <span className="rounded-full border border-border px-3 py-1">{styleLabel} 스타일</span>
          </div>

          {design.description && (
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <p className="mb-2 text-xs font-semibold text-accent">AI 디자이너 노트</p>
              <p className="text-sm leading-relaxed text-foreground">{design.description}</p>
            </div>
          )}

          {design.estimate && (
            <div className="rounded-2xl border border-border p-5">
              <p className="mb-2 text-xs font-semibold text-accent">AI 예상 견적</p>
              <p className="text-lg font-bold">
                {formatWon(design.estimate.minPrice)} ~ {formatWon(design.estimate.maxPrice)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {design.estimate.areaSqm}㎡ 기준 · ㎡당 약 {formatWon(design.estimate.pricePerSqm)}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                ※ AI가 산출한 참고용 예상 범위이며, 실제 견적은 상담을 통해 안내드립니다.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border p-6">
          <ConsultRequestForm designImageId={design.id} />
        </div>
      </div>
    </div>
  );
}
