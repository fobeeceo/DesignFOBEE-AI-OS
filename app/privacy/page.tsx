import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/section-heading";
import { COMPANY } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${COMPANY.name} 개인정보처리방침 — 가맹·인테리어 상담 신청과 GBRICK Coffee 앱 이용 시 수집하는 개인정보의 항목·목적·보유기간과 정보주체의 권리를 안내합니다.`,
  alternates: { canonical: "/privacy" },
};

type Section = { title: string; body: string[] };

// 1부: 가맹·인테리어·AI 설계 상담 (기존 내용 그대로)
const SECTIONS: Section[] = [
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

// 2부: GBRICK Coffee 앱(모바일 주문) — 2026-11-19 추가
const APP_SECTIONS: Section[] = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: [
      "회원(카카오·네이버 로그인) 이용 시: 로그인 수단(카카오 또는 네이버), 해당 서비스가 부여한 회원 고유번호, 닉네임(카카오) 또는 이름(네이버)",
      "주문 시(회원·비회원 공통): 주문번호, 주문 매장, 주문 메뉴·옵션, 결제 예정 금액, 주문 시각·상태, 픽업 이름(선택), 요청사항(선택)",
      "주문 상태 알림을 받는 경우: 브라우저(웹 푸시) 알림 구독 정보(알림을 보내기 위한 기기·브라우저 식별 주소)",
      "자동 수집: 로그인 상태 유지용 쿠키(gbrick_member, 최대 60일)",
      "회사는 카카오·네이버로부터 이메일, 전화번호, 프로필 사진 등을 받지 않습니다.",
    ],
  },
  {
    title: "2. 개인정보의 수집·이용 목적",
    body: [
      "회원 식별과 로그인, 본인의 주문 내역 제공",
      "주문 접수, 매장의 주문 확인·조리·픽업 안내",
      "주문 상태(접수·준비 완료·취소) 알림",
      "문의 대응, 비정상적인 반복 주문 방지",
    ],
  },
  {
    title: "3. 개인정보의 보유 및 이용기간",
    body: [
      "회원 정보: 탈퇴할 때까지 보관합니다. 탈퇴하면 닉네임(이름)을 삭제하고 계정을 비활성화합니다.",
      "주문 기록(회원번호가 연결된 기록 포함): 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 계약·거래 기록은 5년, 소비자 불만 또는 분쟁 처리 기록은 3년간 보관한 뒤 파기합니다.",
      "알림 구독 정보: 주문 단위로 저장하며, 주문 후 1~2일 이내에 자동으로 삭제합니다.",
      "그 밖에 관계 법령에 따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다.",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: [
      "회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다.",
      "카카오·네이버는 로그인 기능을 제공하는 사업자이며, 이용자가 동의한 항목(닉네임 또는 이름, 회원 고유번호)을 회사가 전달받습니다.",
    ],
  },
  {
    title: "5. 개인정보 처리업무의 위탁 및 국외 이전",
    body: [
      "Supabase Inc.(미국 법인): 회원·주문 정보 저장(데이터베이스 운영)",
      "Vercel Inc.(미국 법인): 앱(웹 서비스) 운영·제공",
      "이전 항목: 위 1항의 수집 항목 / 이전 시기·방법: 서비스 이용 시 정보통신망을 통한 전송 / 이용 목적: 서비스 제공(회원·주문 정보 저장과 앱 운영) / 보유·이용기간: 위 3항과 같으며, 회원 탈퇴 또는 위탁계약 종료 시까지",
      "위탁업체의 데이터센터가 위치한 국가는 서비스 설정에 따라 달라질 수 있으며, 변경 시 이 방침에 공지합니다.",
      "국외 이전을 원하지 않는 이용자는 회원 가입 없이 비회원으로 주문하거나 회원 탈퇴를 요청할 수 있습니다. 다만 주문 접수 자체에는 위 위탁이 불가피합니다.",
    ],
  },
  {
    title: "6. 쿠키의 사용과 거부",
    body: [
      "로그인 상태를 유지하기 위해 쿠키(gbrick_member)를 사용합니다. 로그인할 때 만들어지며 최대 60일 뒤 사라지고, 로그아웃하면 삭제됩니다.",
      "브라우저 설정에서 쿠키를 차단할 수 있습니다. 다만 차단하면 로그인 기능을 이용할 수 없으며, 비회원 주문은 이용할 수 있습니다.",
    ],
  },
  {
    title: "7. 정보주체의 권리와 행사 방법",
    body: [
      "이용자는 앱 마이페이지의 '회원탈퇴'에서 직접 탈퇴할 수 있습니다. 진행 중인 주문이 있으면 픽업을 마친 뒤 탈퇴할 수 있습니다.",
      `열람·정정·삭제·처리정지는 문의처(${COMPANY.phone} / ${COMPANY.email})로 요청할 수 있으며, 지체 없이 조치합니다.`,
      "로그인 없이도 주문할 수 있으며, 로그인에 동의하지 않으면 주문 내역을 앱에서 다시 보는 기능만 제한됩니다.",
    ],
  },
  {
    title: "8. 개인정보의 안전성 확보 조치",
    body: [
      "전송 구간 암호화(HTTPS) 통신",
      "로그인 정보는 서명된 쿠키(HttpOnly)로 보호",
      "회원·주문 정보는 서버에서만 조회·변경할 수 있도록 접근을 제한",
      "사장님(매장) 앱은 비밀번호(PIN)를 통과한 경우에만 주문 처리와 메뉴 수정 가능",
    ],
  },
];

// 공통: 1부·2부 모두에 적용
const COMMON_SECTIONS: Section[] = [
  {
    title: "개인정보의 파기 절차와 방법",
    body: [
      "보유기간이 끝났거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다.",
      "전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제합니다.",
      "법령에 따라 보존해야 하는 정보는 다른 정보와 분리하여 보관한 뒤 보존기간이 끝나면 파기합니다.",
    ],
  },
  {
    title: "권익침해 구제 방법",
    body: [
      "개인정보 침해로 인한 상담·신고는 아래 기관에 문의할 수 있습니다.",
      "개인정보침해 신고센터(한국인터넷진흥원): 국번 없이 118 (privacy.kisa.or.kr)",
      "개인정보 분쟁조정위원회: 1833-6972 (kopico.go.kr)",
      "대검찰청 사이버수사과: 국번 없이 1301 / 경찰청 사이버수사국: 국번 없이 182",
    ],
  },
  {
    title: "방침의 시행일과 변경",
    body: [
      "시행일: 2026년 11월 19일 (GBRICK Coffee 앱 이용자 항목 추가)",
      "본 방침은 시행일 이후 변경사항이 있을 경우 홈페이지를 통해 사전 공지합니다. 포인트·앱 결제 등 새 기능이 추가되면 수집 항목과 목적을 함께 개정합니다.",
    ],
  },
];

function SectionList({ sections }: { sections: Section[] }) {
  return (
    <div className="mt-8 flex flex-col gap-10">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <h4 className="text-lg font-semibold text-foreground">{section.title}</h4>
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
  );
}

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
              description={`${COMPANY.name}는 상담 신청과 GBRICK Coffee 앱 이용 과정에서 수집하는 최소한의 개인정보를 아래와 같이 처리합니다.`}
              align="left"
            />

            <h3 className="mt-12 text-xl font-bold text-foreground">1부. 가맹·인테리어·AI 설계 상담</h3>
            <SectionList sections={SECTIONS} />

            <h3 id="app" className="mt-16 scroll-mt-24 text-xl font-bold text-foreground">
              2부. GBRICK Coffee 앱(모바일 주문) 이용자
            </h3>
            <SectionList sections={APP_SECTIONS} />

            <h3 className="mt-16 text-xl font-bold text-foreground">공통 사항</h3>
            <SectionList sections={COMMON_SECTIONS} />

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
