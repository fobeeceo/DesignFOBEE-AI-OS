import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://designfobee.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DesignFOBEE — AI가 설계하는 당신의 공간",
    template: "%s | DesignFOBEE",
  },
  description:
    "26년 공간디자인 경험과 AI가 결합된 공간 브랜딩 기업, 디자인포비. 사진 한 장으로 AI 공간 분석, 디자인 제안, 예상 견적을 받아보세요.",
  keywords: ["공간디자인", "인테리어", "공간브랜딩", "AI 인테리어", "디자인포비", "GBRICK Coffee"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "DesignFOBEE",
    title: "DesignFOBEE — AI가 설계하는 당신의 공간",
    description: "26년 공간디자인 경험 × AI. 사진 한 장으로 시작하는 공간 설계.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "GBRICK Coffee 은평본점 야간 매장 외관" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DesignFOBEE — AI가 설계하는 당신의 공간",
    description: "26년 공간디자인 경험 × AI. 사진 한 장으로 시작하는 공간 설계.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "디자인포비 (DesignFOBEE)",
              description: "공간디자인 및 인테리어, 공간 브랜딩 전문기업",
              foundingDate: "2000-10-27",
              email: "ceo@fobee.co.kr",
              url: SITE_URL,
            }),
          }}
        />
      </body>
    </html>
  );
}
