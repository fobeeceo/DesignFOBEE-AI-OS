import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadDetail } from "@/services/crmService";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { LeadStatusControl } from "@/components/admin/LeadStatusControl";
import { LeadNoteForm } from "@/components/admin/LeadNoteForm";
import { LeadAiPanel } from "@/components/admin/LeadAiPanel";
import { getCasesByCodes } from "@/lib/franchise/successCases";
import { ROOM_TYPES, STYLES } from "@/prompts/interiorStyles";

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

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

  // /franchise 상담 리드만 값이 있으므로, 값이 있는 항목만 표시한다(다른 경로 리드는 섹션 자체를 숨김).
  const franchiseFields = [
    { label: "상담 목적", value: lead.consultationPurpose },
    { label: "창업 희망지역", value: lead.preferredRegion },
    { label: "창업 예정시기", value: lead.plannedTiming },
    { label: "예상 투자금", value: lead.expectedInvestment },
    { label: "현재 직업", value: lead.currentOccupation },
    {
      label: "점포 보유",
      value: lead.hasStorefront === null || lead.hasStorefront === undefined
        ? null
        : lead.hasStorefront
          ? "보유"
          : "미보유",
    },
  ].filter((field): field is { label: string; value: string } => Boolean(field.value));

  const recommendedCases = getCasesByCodes(lead.recommendedCases ?? []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/leads" className="text-xs text-muted-foreground hover:underline">
            ← 리드 목록으로
          </Link>
          <h1 className="mt-1 text-xl font-bold">{lead.name}</h1>
          {lead.referenceNo && (
            <p className="mt-0.5 text-xs font-medium tracking-wider text-muted-foreground">
              접수번호 {lead.referenceNo}
            </p>
          )}
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

          {lead.fitScore != null && (
            <div className="rounded-2xl border border-border p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-accent">AI 진단</p>
                {lead.priority && (
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                    우선순위 {PRIORITY_LABEL[lead.priority] ?? lead.priority}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-accent">{lead.fitScore}점</p>
              <p className="mt-1 text-xs text-muted-foreground">
                창업 적합도(참고 지표) — 가맹 승인 여부를 결정하는 심사 결과가 아닙니다.
              </p>

              {lead.tags && lead.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {recommendedCases.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">추천 성공사례</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {recommendedCases.map((item) => (
                      <li key={item.code} className="text-sm">
                        <span className="font-medium">{item.code}</span> · {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {franchiseFields.length > 0 && (
            <div className="rounded-2xl border border-border p-5">
              <p className="mb-3 text-xs font-semibold text-accent">가맹상담 정보</p>
              <dl className="flex flex-col gap-2 text-sm">
                {franchiseFields.map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

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
          <LeadAiPanel
            leadId={lead.id}
            initialSummary={lead.aiSummary}
            initialNextAction={lead.nextAction}
            initialMemo={lead.aiMemo}
          />

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
