import Link from "next/link";
import { listLeads } from "@/services/crmService";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import type { LeadStatus } from "@/types/lead";

const STATUS_OPTIONS: { value: LeadStatus | ""; label: string }[] = [
  { value: "", label: "전체 상태" },
  { value: "NEW", label: "신규" },
  { value: "CONTACTED", label: "연락함" },
  { value: "CONVERTED", label: "계약전환" },
  { value: "CLOSED", label: "종료" },
];

const VALID_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

interface PageProps {
  searchParams: { status?: string; q?: string; page?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function buildQuery(params: { status?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * STEP 10: 관리자 리드 목록 화면. STEP 9의 crmService.listLeads를 서버에서 직접 호출한다.
 */
export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const status =
    searchParams.status && VALID_STATUSES.includes(searchParams.status as LeadStatus)
      ? (searchParams.status as LeadStatus)
      : undefined;
  const q = searchParams.q || undefined;
  const page = Number(searchParams.page ?? "1") || 1;

  const { leads, total, pageSize } = await listLeads({ status, q, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">리드 관리</h1>
        <span className="text-sm text-muted-foreground">총 {total}건</span>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="이름 · 연락처 · 이메일 검색"
          className="h-10 flex-1 min-w-[200px] rounded-md border border-border bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">이름</th>
              <th className="px-4 py-3 font-semibold">연락처</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">AI 디자인</th>
              <th className="px-4 py-3 font-semibold">경로</th>
              <th className="px-4 py-3 font-semibold">신청일</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  조건에 맞는 리드가 없습니다.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${lead.id}`} className="font-semibold hover:underline">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{lead.hasDesignImage ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.source}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link
            href={`/admin/leads${buildQuery({ status, q, page: page - 1 })}`}
            aria-disabled={page <= 1}
            className={`font-medium ${page <= 1 ? "pointer-events-none text-muted-foreground/40" : "hover:underline"}`}
          >
            이전
          </Link>
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Link
            href={`/admin/leads${buildQuery({ status, q, page: page + 1 })}`}
            aria-disabled={page >= totalPages}
            className={`font-medium ${page >= totalPages ? "pointer-events-none text-muted-foreground/40" : "hover:underline"}`}
          >
            다음
          </Link>
        </div>
      )}
    </div>
  );
}
