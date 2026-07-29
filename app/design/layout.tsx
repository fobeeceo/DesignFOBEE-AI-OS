import { notoSerifKR } from "@/lib/fonts";

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return <div className={notoSerifKR.variable}>{children}</div>;
}
