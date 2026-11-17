import { describe, it, expect } from "vitest";
import { orderGroups, isSingleSelectGroup } from "./optionGroups";

describe("option groups", () => {
  it("only temperature and milk are pick-one", () => {
    expect(isSingleSelectGroup("온도")).toBe(true);
    expect(isSingleSelectGroup("우유변경")).toBe(true);
    for (const g of ["추가옵션", "사이즈", "기타", "시럽", null, undefined]) expect(isSingleSelectGroup(g)).toBe(false);
  });

  it("orders known groups first, then unknown ones as they appear", () => {
    expect(orderGroups(["추가옵션", "시럽", "우유변경", "추가옵션", "토핑", "온도"])).toEqual(["온도", "우유변경", "추가옵션", "시럽", "토핑"]);
  });
});
