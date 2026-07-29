import path from "path";
import { CONTENT_AUTOMATION_OUTPUT_DIR } from "./constants";

/** AI HQ Core — 실행 환경에서 계산해야 하는 설정값(경로 등)을 한 곳에 모은다. */
export const config = {
  /** content-automation-agent 산출물 폴더의 절대경로. */
  contentAutomationOutputDir(cwd: string = process.cwd()): string {
    return path.join(cwd, ...CONTENT_AUTOMATION_OUTPUT_DIR);
  },
};
