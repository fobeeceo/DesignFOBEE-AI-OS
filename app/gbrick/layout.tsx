import type { Metadata, Viewport } from "next";
import { GBRICK_BRAND } from "@/lib/gbrick/constants";

export const metadata: Metadata = {
  title: { default: GBRICK_BRAND.name, template: `%s | ${GBRICK_BRAND.name}` },
  description: "지브릭커피 모바일 주문 & 멤버십",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: GBRICK_BRAND.name,
    startupImage: [{ url: "/icons/apple-touch-icon.png" }],
  },
  icons: {
    icon: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2C1A0E",
};

export default function GbrickLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#FAF8F5", maxWidth: 480, margin: "0 auto" }}
    >
      {children}
    </div>
  );
}
