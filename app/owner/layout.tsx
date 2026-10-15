import type { Metadata } from "next";
import { OwnerShell } from "@/components/owner/OwnerShell";

export const metadata: Metadata = {
  title: "점주 포탈 — GBRICK Coffee",
  description: "GBRICK Coffee 가맹점 점주 전용 공간. 근로계약서, 대타 기록지, 계약/법무, 공급/발주.",
  robots: { index: false, follow: false },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <OwnerShell>{children}</OwnerShell>;
}
