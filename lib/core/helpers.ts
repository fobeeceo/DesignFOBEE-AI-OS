import { promises as fs } from "fs";

/** AI HQ Core — 여러 API route가 공유하는 범용 헬퍼. 도메인 로직은 넣지 않는다. */

/** JSON 파일을 읽어 T로 파싱. 파일이 없거나 파싱 실패면 null(호출자가 폴백 처리). */
export async function readJsonFile<T>(absolutePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(absolutePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
