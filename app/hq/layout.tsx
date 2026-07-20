import type { Metadata } from "next";
import { HqShell } from "@/components/hq/HqShell";

export const metadata: Metadata = {
  title: "AI Headquarters",
  description: "GBRICK AI 본사 운영 시스템 — CEO Dashboard, ERP, 가맹점, 물류, 교육, 콘텐츠, AI 직원.",
};

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <HqShell>{children}</HqShell>;
}
