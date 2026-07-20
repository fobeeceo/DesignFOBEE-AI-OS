import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스 병합 유틸 (shadcn 표준 패턴)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
