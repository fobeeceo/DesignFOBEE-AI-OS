import { ContactForm } from "@/components/home/ContactForm";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * 상담 신청 폼 섹션. POST /api/leads로 제출된다.
 */
export function CTASection() {
  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-2xl">
        <SectionHeading
          eyebrow="Get Started"
          title="지금 AI 상담을 시작하세요"
          description="이름과 연락처만 남겨주시면 담당자가 확인 후 연락드립니다."
        />

        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
