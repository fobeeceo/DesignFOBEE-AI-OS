import { HQ_MENU, ERP_SNAPSHOT as E } from "@/lib/hq/erpSnapshot";

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

      {params.section === "content" && (
        <div className="rounded-2xl border border-border p-5 text-sm">
          <p className="font-semibold">콘텐츠센터 요약</p>
          <p className="mt-2 text-muted-foreground">AI 직원 {E.masters.menus > 0 ? "13 Media Worker" : ""} · OSMU 산출: blog/shorts/instagram/youtube/tiktok/naver.</p>
        </div>
      )}
    </div>
  );
}
