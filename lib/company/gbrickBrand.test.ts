import { describe, expect, it } from "vitest";
import { GBRICK_BRAND } from "./profile";

describe("GBRICK_BRAND (대표 확인 2026-10-26)", () => {
  it("브랜드명·주소·원두·주요 메뉴가 대표 확인값과 같다", () => {
    expect(GBRICK_BRAND.nameKo).toBe("지브릭커피");
    expect(GBRICK_BRAND.nameEn).toBe("GBRICK Coffee");
    expect(GBRICK_BRAND.address.full).toBe("서울 은평구 연서로48길 12, 제각말푸르지오 5단지 상가 101호");
    expect(GBRICK_BRAND.beans).toBe("자체 블렌딩 원두");
    expect([...GBRICK_BRAND.mainMenu]).toEqual(["아메리카노", "자몽티", "뱅쇼", "팥빙수"]);
  });

  it("팥빙수는 기온 기준 하절기 운영이며 영업 보장이 아니라고 명시한다", () => {
    expect(GBRICK_BRAND.patbingsu.basis).toContain("28℃");
    expect(GBRICK_BRAND.patbingsu.typicalMonths).toBe("4~9월경");
    expect(GBRICK_BRAND.patbingsu.note).toContain("달라질 수 있습니다");
  });

  it("대표가 확인하지 않은 항목은 값을 채우지 않고 목록으로만 둔다", () => {
    const keys = Object.keys(GBRICK_BRAND);
    for (const forbidden of ["hours", "phone", "price", "parking", "walkMinutes"]) {
      expect(keys).not.toContain(forbidden);
    }
    expect([...GBRICK_BRAND.unconfirmed]).toEqual(
      expect.arrayContaining(["영업시간", "전화번호", "가격", "주차 조건", "한옥마을까지 도보 시간"]),
    );
  });
});
