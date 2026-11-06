import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "GBRICK Store", template: "%s | GBRICK Store" },
  description: "지브릭커피 가맹점 관리 시스템",
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
