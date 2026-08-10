import { describe, expect, it } from "vitest";
import { validateDrawings } from "./validateDrawings";

/**
 * 서버 재검증 테스트.
 * 클라이언트를 우회한 직접 호출을 가정하고, 통과시키면 안 되는 것을 중심으로 본다.
 */

function file(name: string, type: string, size: number): File {
  const f = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

const okFile = () => file("plan.pdf", "application/pdf", 1024);

describe("validateDrawings", () => {
  it("정상 파일을 통과시킨다", () => {
    const r = validateDrawings([okFile(), file("a.jpg", "image/jpeg", 2048)]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.files).toHaveLength(2);
  });

  it("파일이 없으면 막는다", () => {
    expect(validateDrawings([])).toMatchObject({ ok: false });
  });

  it("빈 파일(size 0)은 없는 것으로 본다", () => {
    expect(validateDrawings([file("empty.pdf", "application/pdf", 0)])).toMatchObject({ ok: false });
  });

  it("5개를 넘으면 막는다", () => {
    const r = validateDrawings(Array.from({ length: 6 }, okFile));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("5개");
  });

  it("10MB를 넘으면 막는다", () => {
    const r = validateDrawings([file("big.pdf", "application/pdf", 10 * 1024 * 1024 + 1)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("10MB");
  });

  it("허용하지 않는 확장자를 막는다", () => {
    expect(validateDrawings([file("run.exe", "application/pdf", 1024)])).toMatchObject({ ok: false });
  });

  it("확장자를 위장해도 MIME이 다르면 막는다", () => {
    // .pdf로 이름만 바꾼 실행 파일을 가정한다.
    expect(
      validateDrawings([file("plan.pdf", "application/x-msdownload", 1024)])
    ).toMatchObject({ ok: false });
  });

  it("File이 아닌 값은 무시한다", () => {
    expect(validateDrawings(["문자열", null, undefined])).toMatchObject({ ok: false });
  });
});
