import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * 홈페이지 모든 섹션에서 공통으로 쓰는 타이틀 블록.
 * 톤앤매너(심플·프리미엄) 통일을 위해 섹션마다 재구현하지 않는다.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-muted-foreground text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
