import { HQ_MENU, ERP_SNAPSHOT as E, STORES, AI_STAFF, won } from "@/lib/hq/erpSnapshot";

const STATUS_STYLE: Record<string, string> = {
  정규직: "bg-accent/15 text-accent",
  개선중: "bg-amber-500/15 text-amber-600",
  수습: "bg-blue-500/15 text-blue-600",
  개발중: "bg-blue-500/15 text-blue-600",
  설계: "bg-muted text-muted-foreground",
  은퇴: "bg-muted text-muted-foreground line-through",
};

/** 인사 상태 배지(CEO MASTER 업무지시서 §9 6단계: 설계/개발중/수습/정규직/개선중/은퇴). */
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

const SECTION: Record<string, { title: string; desc: string; note: string }> = {
  franchise: { title: "가맹점", desc: "가맹점 로그인 · 오늘 매출 · 재고 · 발주 · 교육 · 공지 · 매뉴얼 · 본사 문의", note: "가맹점별 뷰(멀티테넌트)는 HQ 셸 위에 역할별로 연결 예정. 현재 본점 데이터 기준." },
  logistics: { title: "물류", desc: "전국 발주 취합 · 재고 배송 · 거래처(SUPPLIER_MASTER) · 입고 관리", note: "발주추천은 ERP에서 산출됨. 물류 라우팅은 SUPPLIER_MASTER 연결 후." },
  academy: { title: "교육센터", desc: "신규 5일 · 보수교육 · 매뉴얼 · SOP · 커피교육 자료", note: "교육 SOP/매뉴얼은 Notion 운영시스템에 구축됨." },
  content: { title: "콘텐츠센터", desc: "OSMU 생성 → 7플랫폼 발행 → 성과 분석 → Living Document 환류", note: "Media OS(content-automation-agent) 연결. 실업로드는 OAuth 키 후." },
  staff: { title: "AI 직원", desc: "13 Media Worker + 6 역할 AI (Mission·SOP·KPI·Prompt)", note: "AI Prompt Library / Media Workforce(Notion)와 연결." },
  settings: { title: "설정", desc: "SSOT · 권한 · 배포 · 환경변수", note: "Master DB(SSOT) 기준. Drive=원본, 변경은 Change Report 경유." },
};

export default function HqSection({ params }: { params: { section: string } }) {
  const s = SECTION[params.section];
  const menu = HQ_MENU.find((m) => m.key === params.section);

  if (!s) {
    return <div className="text-sm text-muted-foreground">알 수 없는 섹션입니다. <a href="/hq" className="underline">대시보드로</a></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{menu?.icon} {s.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">MVP · 연결 준비</span>
        <p className="mt-3 text-sm leading-relaxed">{s.note}</p>
      </div>

      {params.section === "franchise" && (
        <div className="rounded-2xl border border-border p-5">
          <h2 className="mb-3 text-sm font-bold">전국 가맹/직영점 ({STORES.length}개 · 3년 폐점 0건)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2">매장</th><th>유형</th><th>지역</th><th>개점</th><th>데이터</th>
              </tr>
            </thead>
            <tbody>
              {STORES.map((s) => (
                <tr key={s.name} className="border-b border-border/50">
                  <td className="py-2 font-medium">{s.name}</td>
                  <td>{s.type}</td>
                  <td className="text-muted-foreground">{s.region}</td>
                  <td className="text-muted-foreground">{s.open}</td>
                  <td>{s.live ? <span className="text-accent font-semibold">POS 연결</span> : <span className="text-muted-foreground">대기</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">본점 실적: {won(E.sales.revenue)} · {E.sales.qty.toLocaleString()}잔 ({E.sales.period}). 타 매장은 POS 업로드 연결 시 자동 집계.</p>
        </div>
      )}

      {params.section === "logistics" && (
        <div className="rounded-2xl border border-border p-5">
          <h2 className="mb-3 text-sm font-bold">발주 집계 (본점 · 안전재고 미달 {E.inventory.shortageCount}건)</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {E.inventory.reorders.map((r) => (
              <li key={r.item} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {r.urgent && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">긴급</span>}
                  {r.item}
                </span>
                <span className="font-semibold">{r.order}개</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">거래처 라우팅은 SUPPLIER_MASTER 연결 후. 전국 발주 취합은 매장 POS 연결 시 자동.</p>
        </div>
      )}

      {params.section === "content" && (
        <div className="rounded-2xl border border-border p-5 text-sm">
          <p className="font-semibold">콘텐츠센터 요약</p>
          <p className="mt-2 text-muted-foreground">AI 직원 13 Media Worker · OSMU 산출: blog/shorts/instagram/youtube/tiktok/naver.</p>
        </div>
      )}

      {params.section === "academy" && (
        <div className="rounded-2xl border border-border p-5 text-sm">
          <h2 className="mb-2 text-sm font-bold">교육 체계 (정보공개서 Ⅶ)</h2>
          <ul className="flex flex-col gap-1 text-muted-foreground">
            <li>· 신규교육 5일 (계약 후 1개월 내 필수, 집단강의+실습)</li>
            <li>· 보수교육 매년 · 수시교육 3일 · 교육비 실비</li>
            <li>· 교육 과정: 회사소개 · 음료제조 · POS · 위생 · 매장운영</li>
          </ul>
          <p className="mt-2 text-xs">SOP·매뉴얼은 Notion 운영시스템(오픈/마감/고객응대/음료제조/청소)에 구축됨.</p>
        </div>
      )}

      {params.section === "settings" && (
        <div className="rounded-2xl border border-border p-5 text-sm">
          <h2 className="mb-2 text-sm font-bold">SSOT / 시스템</h2>
          <ul className="flex flex-col gap-1 text-muted-foreground">
            <li>· 정본: Master DB(Notion) + Google Drive = SSOT. 변경은 Change Report 경유.</li>
            <li>· 메뉴 {E.masters.menus}종 · 원재료 {E.masters.ingredientGroups}품목 · 옵션 {E.masters.options}종.</li>
            <li>· 배포: git push → Vercel 자동배포 (design-fobee-ai-os.vercel.app).</li>
          </ul>
        </div>
      )}

      {params.section === "staff" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border p-5">
            <h2 className="mb-3 text-sm font-bold">역할 AI ({AI_STAFF.roles.length})</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {AI_STAFF.roles.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span className="text-right text-xs text-muted-foreground">{r.mission}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <h2 className="mb-3 text-sm font-bold">Media Workforce ({AI_STAFF.media.length})</h2>
            <div className="flex flex-wrap gap-2">
              {AI_STAFF.media.map((m) => (
                <span key={m.name} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">
                  {m.name}
                  <StatusBadge status={m.status} />
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            인사 상태 6단계(CEO MASTER 업무지시서 §9): 설계→개발중→수습→정규직→개선중→은퇴. 상세 인증조건 11개는 <a href="https://github.com/fobeeceo/DesignFOBEE-AI-OS/blob/main/AI-STAFF-POLICY.md" className="underline" target="_blank" rel="noreferrer">AI-STAFF-POLICY.md</a> §2 참조.
          </p>
        </div>
      )}
    </div>
  );
}
