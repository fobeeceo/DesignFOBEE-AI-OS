import { SectionHeading } from "@/components/ui/section-heading";
import { Camera, ScanSearch, Palette, Calculator, MessageCircle } from "lucide-react";

const STEPS = [
  { icon: Camera, title: "사진 업로드", desc: "공간 사진 한 장이면 시작" },
  { icon: ScanSearch, title: "AI 공간 분석", desc: "구조·면적·톤 자동 분석" },
  { icon: Palette, title: "AI 디자인 생성", desc: "맞춤 인테리어 이미지 제안" },
  { icon: Calculator, title: "AI 예상 견적", desc: "즉시 확인하는 예상 비용" },
  { icon: MessageCircle, title: "전문 상담", desc: "AI 분석 결과로 상담 진행" },
];

/**
 * 홈페이지에서 미리 보여주는 AI Sales OS 플로우.
 * STEP 3~8 개발 완료 후 실제 기능으로 연결된다.
 */
export function ProcessSection() {
  return (
    <section id="process" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="사진 한 장으로 시작하는 AI 공간 설계"
          description="업로드부터 상담까지, AI가 24시간 당신의 공간을 분석하고 제안합니다."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative flex flex-col gap-3 rounded-2xl bg-background p-6 border border-border">
              <span className="text-xs font-semibold text-accent">STEP {i + 1}</span>
              <Icon className="h-7 w-7" />
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
