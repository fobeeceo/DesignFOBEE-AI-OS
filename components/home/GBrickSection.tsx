import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Coffee } from "lucide-react";

/**
 * GBRICK Coffee 브랜드 소개 섹션. "공간과 커피를 결합한 브랜드" 철학 전달.
 */
export function GBrickSection() {
  return (
    <section id="gbrick" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-accent/10 p-10 text-center sm:p-16">
          <Coffee className="h-9 w-9 text-accent" />
          <SectionHeading
            title="GBRICK Coffee"
            description="공간과 커피를 결합한 브랜드. 고객은 커피가 아니라 좋은 공간을 경험하러 옵니다. 사람과 사람을 연결하는, 좋은 에너지가 흐르는 공간입니다."
          />
          <a
            href="#contact"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            GBRICK Coffee 알아보기
          </a>
        </div>
      </div>
    </section>
  );
}
