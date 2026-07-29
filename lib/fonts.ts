import { Noto_Serif_KR } from "next/font/google";

/**
 * /design 페이지(AI 디자인 스튜디오)에서만 쓰는 표시용 세리프 폰트.
 * 홈페이지 전역 globals.css의 @import 대신 next/font로 이 라우트에만 스코프해
 * 나머지 페이지의 렌더 블로킹 네트워크 요청을 없앤다(Sprint2 P3 성능 개선).
 */
export const notoSerifKR = Noto_Serif_KR({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});
