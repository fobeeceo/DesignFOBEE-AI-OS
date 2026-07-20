import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "회원가입",
  description: "DesignFOBEE 회원가입",
};

export default function SignupPage() {
  return (
    <main className="container-px mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          가입 후 사진 업로드부터 AI 공간 분석까지 바로 이용하실 수 있습니다.
        </p>
      </div>

      <AuthForm mode="signup" />

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          로그인
        </Link>
      </p>
    </main>
  );
}
