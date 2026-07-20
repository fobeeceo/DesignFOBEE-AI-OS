import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

// 로그인은 요청 시점 인증 상태에 의존하므로 빌드 프리렌더 대상에서 제외한다.
// (Supabase env 미설정 상태에서도 배포 빌드가 실패하지 않도록 보장)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "로그인",
  description: "DesignFOBEE 로그인",
};

export default function LoginPage() {
  return (
    <main className="container-px mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AI 공간 분석과 상담 이력을 이어서 확인하세요.
        </p>
      </div>

      <AuthForm mode="login" />

      <p className="text-center text-sm text-muted-foreground">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </main>
  );
}
