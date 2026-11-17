// 메뉴 옵션 묶음(그룹). 고객 앱과 사장님 앱이 같은 규칙을 쓴다.

/** 사장님 앱에서 고를 수 있는 묶음 — 이 순서대로 화면에 보인다 */
export const OPTION_GROUPS = ["온도", "우유변경", "추가옵션", "사이즈", "기타"] as const;

/** 하나만 고르는 묶음. 나머지 묶음은 여러 개를 함께 고를 수 있다. */
export const SINGLE_SELECT_GROUPS: readonly string[] = ["온도", "우유변경"];

export const isSingleSelectGroup = (group: string | null | undefined) => SINGLE_SELECT_GROUPS.includes(group ?? "");

/** 묶음 이름들을 화면 순서로 정렬한다 (정해진 묶음 먼저, 그 밖의 이름은 처음 나온 순서대로) */
export function orderGroups(groups: Iterable<string>): string[] {
  const unique = [...new Set(groups)];
  const rank = (g: string) => {
    const i = (OPTION_GROUPS as readonly string[]).indexOf(g);
    return i === -1 ? OPTION_GROUPS.length + unique.indexOf(g) : i;
  };
  return unique.sort((a, b) => rank(a) - rank(b));
}
