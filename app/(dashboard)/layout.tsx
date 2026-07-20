import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

/**
 * 로그인 사용자 전용 영역 (STEP 3 사진업로드 등). 세션이 없으면 로그인 페이지로 보낸다.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeader email={user.email ?? ""} />
      <main className="container-px mx-auto max-w-4xl py-10">{children}</main>
    </>
  );
}
