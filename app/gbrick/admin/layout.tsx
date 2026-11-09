import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "GBRICK 사장님 앱", template: "%s | GBRICK 사장님" },
  description: "지브릭커피 매장 관리 — 메뉴·영업시간·품절 관리",
  manifest: "/manifest-admin.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "사장님앱",
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
  themeColor: "#1A0F06",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
