import { SectionHeading } from "@/components/ui/section-heading";
import { Building2, Church, GraduationCap, Briefcase, Home } from "lucide-react";
import { SERVICES as SERVICE_DATA } from "@/lib/company/profile";

const ICONS = [Building2, Church, GraduationCap, Briefcase, Home];
const SERVICES = SERVICE_DATA.map((s, i) => ({ ...s, icon: ICONS[i] }));

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
