import { describe, expect, it } from "vitest";
import { GBRICK_BRAND } from "./profile";

describe("GBRICK_BRAND (대표 확인 2026-10-26, 2026-11-04 갱신)", () => {
  it("브랜드명·주소·원두·주요 메뉴가 대표 확인값과 같다", () => {
    expect(GBRICK_BRAND.nameKo).toBe("지브릭커피");
    expect(GBRICK_BRAND.nameEn).toBe("GBRICK Coffee");
    expect(GBRICK_BRAND.address.full).toBe("서울 은평구 연서로48길 12, 제각말푸르지오 5단지 상가 101호");
    // 2026-11-04 대표 결정: 아메리카노 2종(스페셜티/예가체프)으로 분리 — "자체 블렌딩 원두" 단일 표기 폐기
    expect(GBRICK_BRAND.beans).toContain("스페셜티 원두");
    expect(GBRICK_BRAND.beans).toContain("예가체프 원두");
    // 2026-11-04 대표 결정: 아메리카노 2종 + 자몽 2종 → 6개 메뉴로 확장
    expect([...GBRICK_BRAND.mainMenu]).toContain("아메리카노 (스페셜티)");
    expect([...GBRICK_BRAND.mainMenu]).toContain("아메리카노 (예가체프)");
    expect([...GBRICK_BRAND.mainMenu]).toContain("수제 에이드 자몽");
    expect([...GBRICK_BRAND.mainMenu]).toContain("수제티 생자몽");
    expect([...GBRICK_BRAND.mainMenu]).toContain("뱅쇼");
    expect([...GBRICK_BRAND.mainMenu]).toContain("수제 팥빙수");
    expect([...GBRICK_BRAND.mainMenu]).toHaveLength(6);
  });

  it("팥빙수는 기온 기준 하절기 운영이며 영업 보장이 아니라고 명시한다", () => {
    expect(GBRICK_BRAND.patbingsu.basis).toContain("28℃");
    expect(GBRICK_BRAND.patbingsu.typicalMonths).toBe("4~9월경");
    expect(GBRICK_BRAND.patbingsu.note).toContain("달라질 수 있습니다");
  });

  it("전화번호가 대표 확인값이다", () => {
    expect(GBRICK_BRAND.phone).toBe("02-517-1474");
  });

  it("대표가 확인하지 않은 항목은 값을 채우지 않고 목록으로만 둔다", () => {
    const keys = Object.keys(GBRICK_BRAND);
    for (const forbidden of ["hours", "price", "parking", "walkMinutes"]) {
      expect(keys).not.toContain(forbidden);
    }
    expect([...GBRICK_BRAND.unconfirmed]).toEqual(
      expect.arrayContaining(["영업시간", "가격", "주차 조건", "한옥마을까지 도보 시간"]),
    );
    expect([...GBRICK_BRAND.unconfirmed]).not.toContain("전화번호");
  });
});
