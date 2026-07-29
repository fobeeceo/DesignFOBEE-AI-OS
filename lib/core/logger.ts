/**
 * AI HQ Core — 최소 구조화 로거. console.*을 직접 흩어 쓰지 않고 이 모듈을 거치게 해,
 * 나중에 로그 수집기로 바꿔야 할 때 이 파일만 고치면 되게 한다.
 */
function line(level: string, scope: string, message: string): string {
  return `[${new Date().toISOString()}] [${level}] [${scope}] ${message}`;
}

export const logger = {
  info(scope: string, message: string): void {
    console.log(line("INFO", scope, message));
  },
  warn(scope: string, message: string): void {
    console.warn(line("WARN", scope, message));
  },
  error(scope: string, message: string): void {
    console.error(line("ERROR", scope, message));
  },
};
