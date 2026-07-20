"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  email: string;
}

/**
 * STEP 10: 관리자 페이지 전용 헤더.
 */
export function AdminHeader({ email }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border">
      <div className="container-px mx-auto flex h-16 max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/leads" className="text-lg font-bold tracking-tight">
            DesignFOBEE <span className="text-accent">Admin</span>
          </Link>
          <nav className="hidden text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/admin/leads" className="hover:text-foreground">
              리드 관리
            </Link>
          </nav>
        </div>

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
