import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // text-base(16px)로 시작하는 이유: iOS Safari는 16px 미만 입력란에 포커스하면
          // 페이지를 확대해버려 폼 사용성이 크게 나빠진다. 데스크톱에서만 14px로 줄인다.
          "flex h-11 w-full rounded-md border border-border bg-background px-4 py-2 text-base sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
