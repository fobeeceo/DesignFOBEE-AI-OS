/** AI HQ Core — 공통 에러 타입. 도메인별 커스텀 에러가 필요하면 이 클래스를 상속한다. */
export class AppError extends Error {
  constructor(message: string, public code: string = "APP_ERROR") {
    super(message);
    this.name = "AppError";
  }
}
