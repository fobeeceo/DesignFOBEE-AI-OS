import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadDetail } from "@/services/crmService";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { LeadStatusControl } from "@/components/admin/LeadStatusControl";
import { LeadNoteForm } from "@/components/admin/LeadNoteForm";
import { ROOM_TYPES, STYLES } from "@/prompts/interiorStyles";

interface PageProps {
  params: { leadId: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/**
 * STEP 10: 관리자 리드 상세 화면. STEP 9의 crmService.getLeadDetail을 서버에서 직접 호출한다.
 */
export default async function AdminLeadDetailPage({ params }: PageProps) {
  const lead = await getLeadDetail(params.leadId);
  if (!lead) {
    notFound();
  }

  const design = lead.designImageSummary;
  const roomLabel = design ? ROOM_TYPES.find((r) => r.id === design.roomType)?.label ?? design.roomType : null;
  const styleLabel = design ? STYLES.find((s) => s.id === design.style)?.label ?? design.style : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/leads" className="text-xs text-muted-foreground hover:underline">
            ← 리드 목록으로
          </Link>
          <h1 className="mt-1 text-xl font-bold">{lead.name}</h1>
        </div>
        <LeadStatusControl leadId={lead.id} currentStatus={lead.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border p-5">
            <p className="mb-3 text-xs font-semibold text-accent">기본 정보</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">연락처</dt>
                <dd className="font-medium">{lead.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">이메일</dt>
                <dd className="font-medium">{lead.email || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">상태</dt>
                <dd>
                  <LeadStatusBadge status={lead.status} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">신청 경로</dt>
                <dd className="font-medium">{lead.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">신청일</dt>
                <dd className="font-medium">{formatDate(lead.createdAt)}</dd>
              </div>
            </dl>
            {lead.message && (
              <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">{lead.message}</div>
            )}
          </div>

          {design && (
            <div className="flex flex-col gap-4 rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-accent">첨부된 AI 디자인 결과</p>
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={design.url} alt="AI 리디자인 결과" className="w-full object-cover" />
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full border border-border px-3 py-1">{roomLabel}</span>
                <span className="rounded-full border border-border px-3 py-1">{styleLabel} 스타일</span>
              </div>
              {design.description && (
                <p className="text-sm leading-relaxed text-foreground">{design.description}</p>
              )}
              {design.estimate && (
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-base font-bold">
                    {formatWon(design.estimate.minPrice)} ~ {formatWon(design.estimate.maxPrice)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {design.estimate.areaSqm}㎡ 기준 · ㎡당 약 {formatWon(design.estimate.pricePerSqm)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-accent">상담 메모</p>
          <LeadNoteForm leadId={lead.id} />

          <div className="flex flex-col gap-3">
            {lead.notes.length === 0 && (
              <p className="text-sm text-muted-foreground">아직 남겨진 메모가 없습니다.</p>
            )}
            {lead.notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-border p-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold">{note.authorName || "관리자"}</span>
                  <span>{formatDate(note.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
