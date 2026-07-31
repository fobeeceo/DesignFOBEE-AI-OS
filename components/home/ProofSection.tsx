import { SectionHeading } from "@/components/ui/section-heading";
import {
  COMPANY,
  FOUNDED_YEAR,
  LICENSE_YEAR,
  TOTAL_PROJECTS,
  yearsSince,
} from "@/lib/company/profile";
import { WORK_GALLERY } from "@/lib/portfolio/workGallery";

/**
 * 신뢰의 근거 — CEO 결정(Priority 2 대체 전략).
 * 고객 후기를 만들어내지 않고, 검증 가능한 기록만으로 신뢰를 보여준다.
 *
 * ⚠️ 숫자는 절대 하드코딩하지 않는다. 창업 연도와 실제 갤러리 데이터에서 계산하므로
 *    사진이 추가되거나 해가 바뀌어도 화면의 숫자가 실제와 어긋나지 않는다
 *    (매장 수·폐점 수처럼 사람이 관리해야 하는 수치를 쓰지 않는 이유와 같은 원칙).
 */

/** 갤러리 카테고리("카페 · 라운지" → "카페")별 실제 시공 사례 건수. */
function countByField() {
  const counts = new Map<string, number>();
  for (const item of WORK_GALLERY) {
    const field = item.category.split(" · ")[0];
    counts.set(field, (counts.get(field) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count);
}

export function ProofSection() {
  const fields = countByField();

  const figures = [
    {
      value: `${yearsSince(FOUNDED_YEAR)}년`,
      label: "공간을 만들어온 시간",
      source: `${COMPANY.founded} 설립 · 사업자등록증`,
    },
    {
      value: `${yearsSince(LICENSE_YEAR)}년`,
      label: "설계부터 시공까지 직접",
      source: `${LICENSE_YEAR}년 실내건축공사업 등록증`,
    },
    {
      value: `약 ${TOTAL_PROJECTS}건`,
      label: "누적 시공 프로젝트",
      source: `${FOUNDED_YEAR}년 이후 · 업무지명원 시공사례 기준`,
    },
    {
      value: `${fields.length}개 분야`,
      label: "카페·교회·리테일·오피스·상업공간",
      source: "실제 시공 사진 기준",
    },
  ];

  return (
    <section id="proof" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Evidence"
          title="후기 대신, 기록으로 보여드립니다"
          description="꾸며낸 후기 한 줄보다 실제로 만든 공간이 더 정확합니다. 아래 숫자는 모두 근거가 있는 기록이며, 홈페이지의 실제 사진과 등록증으로 확인하실 수 있습니다."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-muted/40 p-6">
              <p className="text-3xl font-bold text-accent">{item.value}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.source}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          {/* 위 카드의 '약 250건'은 전체 실적(업무지명원)이고, 아래 숫자는 홈페이지에 공개한
              사진 수다. 두 숫자가 서로 모순돼 보이지 않도록 기준을 명확히 표기한다. */}
          <p className="text-sm font-semibold text-foreground">
            홈페이지에 공개한 사례 {WORK_GALLERY.length}건
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {fields.map((item) => (
              <span
                key={item.field}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
              >
                {item.field} <span className="font-semibold text-foreground">{item.count}건</span>
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            ※ 전체 시공 실적 중 촬영·공개 동의를 받은 현장만 홈페이지에 공개하고 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
