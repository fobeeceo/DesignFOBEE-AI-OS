import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/section-heading";
import { COMPANY } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${COMPANY.name} 개인정보처리방침 — 상담 신청 시 수집하는 개인정보의 항목·목적·보유기간과 정보주체의 권리를 안내합니다.`,
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: [
      "필수: 이름, 연락처",
      "선택: 이메일, 창업 희망지역, 창업 예정시기, 예상 투자금, 현재 직업, 점포 보유 여부, 상담 목적, 문의 내용",
      "AI 공간 설계 서비스 이용 시: 이용자가 직접 업로드한 공간 사진",
    ],
  },
  {
    title: "2. 개인정보의 수집·이용 목적",
    body: [
      "인테리어·가맹·AI 설계 상담 신청 접수 및 상담 진행",
      "상담 결과 안내 및 견적 제공",
      "상담 이력 관리 및 문의 대응",
    ],
  },
  {
    title: "3. 개인정보의 보유 및 이용기간",
    body: [
      "상담 종료 후 3년간 보관하며, 기간 경과 시 지체 없이 파기합니다.",
      "관계 법령에 따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다.",
      "정보주체가 삭제를 요청하는 경우 법령상 보존 의무가 없는 범위에서 즉시 파기합니다.",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: [
      "회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다.",
      "다만 법령에 따라 요구되는 경우에 한해 관계 기관에 제공할 수 있습니다.",
    ],
  },
  {
    title: "5. 정보주체의 권리와 행사 방법",
    body: [
      "이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있습니다.",
      `요청은 아래 문의처(${COMPANY.phone} / ${COMPANY.email})로 접수하실 수 있으며, 지체 없이 조치합니다.`,
      "동의를 거부할 권리가 있으며, 다만 필수 항목에 동의하지 않는 경우 상담 신청이 제한될 수 있습니다.",
    ],
  },
  {
    title: "6. 개인정보 보호책임자",
    body: [`${COMPANY.name} 대표 ${COMPANY.ceo}`, `연락처: ${COMPANY.phone}`, `이메일: ${COMPANY.email}`],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container-px mx-auto max-w-3xl">
            <SectionHeading
              eyebrow="Privacy"
              title="개인정보처리방침"
              description={`${COMPANY.name}는 상담 신청 과정에서 수집하는 최소한의 개인정보를 아래와 같이 처리합니다.`}
              align="left"
            />

            <div className="mt-12 flex flex-col gap-10">
              {SECTIONS.map((section) => (
                <div key={section.title} className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                  <ul className="flex flex-col gap-2">
                    {section.body.map((line) => (
                      <li key={line} className="text-sm leading-relaxed text-muted-foreground">
                        · {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
              본 방침은 시행일 이후 변경사항이 있을 경우 홈페이지를 통해 사전 공지합니다.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
