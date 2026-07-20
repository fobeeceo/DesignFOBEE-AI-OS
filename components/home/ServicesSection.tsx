import { SectionHeading } from "@/components/ui/section-heading";
import { Building2, Church, GraduationCap, Briefcase, Home } from "lucide-react";

const SERVICES = [
  { icon: Building2, title: "상업공간", desc: "브랜드 경험을 담은 매장·상업 공간 디자인" },
  { icon: Church, title: "교회", desc: "공동체의 가치를 담은 예배 공간 설계" },
  { icon: GraduationCap, title: "교육시설", desc: "배움에 몰입하는 학습 환경 조성" },
  { icon: Briefcase, title: "오피스", desc: "일하는 방식을 바꾸는 업무 공간 설계" },
  { icon: Home, title: "주거공간", desc: "삶의 질을 높이는 주거 공간 디자인" },
];

/**
 * 디자인포비 핵심 서비스 5개 영역 카드.
 */
export function ServicesSection() {
  return (
    <section id="services" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Our Services"
          title="공간을 넘어, 경험을 디자인합니다"
          description="26년간 쌓아온 노하우로 상업공간부터 주거공간까지, 목적에 맞는 공간을 설계하고 시공합니다."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
            >
              <Icon className="h-7 w-7 text-accent" />
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
