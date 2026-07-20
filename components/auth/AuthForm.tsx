"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, signupSchema } from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

type Mode = "login" | "signup";

/**
 * signup 스키마 기준으로 폼 값 타입을 통일한다(name은 login에서 미사용).
 * mode에 따라 실제 검증 스키마(zodResolver)는 다르게 적용된다.
 */
interface FormValues {
  name: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  mode: Mode;
}

/**
 * 로그인/회원가입 공용 폼.
 * mode="signup"일 때만 이름 필드가 추가되고, 성공 시 /api/profile로 프로필을 생성한다.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // signup/login 스키마가 서로 다른 필드셋을 가져 resolver 타입이 완전히 일치하지
  // 않는다(login에는 name이 없음). 런타임 검증은 정확히 동작하므로 타입만 단언한다.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema) as never,
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);

    try {
      const { name, email, password } = values;

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // 프로필 저장 (세션이 없으면 — 이메일 인증 대기 상태면 — 조용히 건너뛴다)
        if (data.session) {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, provider: "EMAIL" }),
          });
        }

        router.push("/");
        router.refresh();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="홍길동" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" placeholder="8자 이상" {...register("password")} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "처리 중..." : mode === "signup" ? "회원가입" : "로그인"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        또는
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialLoginButtons />
    </div>
  );
}
