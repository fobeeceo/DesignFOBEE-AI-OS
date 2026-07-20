"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DashboardHeaderProps {
  email: string;
}

/**
 * 로그인 후 대시보드 영역(사진 업로드 등)에서 쓰는 간소화된 헤더.
 */
export function DashboardHeader({ email }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border">
      <div className="container-px mx-auto flex h-16 max-w-4xl items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          DesignFOBEE
        </Link>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{email}</span>
          <button onClick={handleLogout} className="font-medium hover:text-foreground">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
