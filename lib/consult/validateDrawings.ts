import { ACCEPTED_EXT, ACCEPTED_MIME, MAX_FILES, MAX_FILE_SIZE } from "@/lib/consult/content";

/**
 * 서버 측 도면 파일 재검증.
 *
 * ⚠️ 클라이언트 검증은 사용자 편의용일 뿐이다. 브라우저를 거치지 않고 API를 직접
 *    호출하면 어떤 파일이든 올릴 수 있으므로, 저장 전에 여기서 반드시 다시 본다.
 *    (원본 HTML 주석의 지시사항이기도 하다.)
 *
 * 순수 함수로 두어 테스트할 수 있게 한다.
 */

export type DrawingCheck =
  | { ok: true; files: File[] }
  | { ok: false; reason: string };

function extOf(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function validateDrawings(input: unknown[]): DrawingCheck {
  const files = input.filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { ok: false, reason: "도면을 최소 1개 첨부해주세요." };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, reason: `도면은 최대 ${MAX_FILES}개까지 첨부하실 수 있습니다.` };
  }

  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      return { ok: false, reason: `"${f.name}" 은 10MB를 넘습니다.` };
    }
    // 확장자와 MIME을 모두 본다. 둘 중 하나만 보면 위장 파일을 통과시킬 수 있다.
    const extOk = (ACCEPTED_EXT as readonly string[]).includes(extOf(f.name));
    const mimeOk = (ACCEPTED_MIME as readonly string[]).includes(f.type);
    if (!extOk || !mimeOk) {
      return {
        ok: false,
        reason: `"${f.name}" 은 보내실 수 없는 형식입니다. JPG·PNG·PDF만 가능합니다.`,
      };
    }
  }

  return { ok: true, files };
}
