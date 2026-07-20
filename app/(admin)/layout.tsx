import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { AdminHeader } from "@/components/layout/AdminHeader";

/**
 * STEP 10: 관리자 페이지 전용 영역. STEP 9의 requireAdmin으로 접근을 제한한다.
 * 미로그인 → /login, 로그인했지만 관리자가 아님 → / (홈).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError && error.code === "NOT_LOGGED_IN") {
      redirect("/login");
    }
    redirect("/");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <AdminHeader email={user?.email ?? ""} />
      <main className="container-px mx-auto max-w-6xl py-10">{children}</main>
    </>
  );
}
