/*
 * 음성 주문용 메뉴(public/voice/menu.json) 생성기
 *
 * 메뉴와 가격의 원본은 public/gbrick-menu.html 입니다 (SSOT, CLAUDE.md §14-A ⑥).
 * 이 스크립트는 그 원본을 읽어 "말로 주문하기"에 필요한 형태로 바꿀 뿐, 가격을 새로 정하지 않습니다.
 *
 *   node scripts/build-voice-menu.mjs           menu.json 생성
 *   node scripts/build-voice-menu.mjs --check   원본과 menu.json이 어긋났는지만 검사 (어긋나면 종료코드 1)
 *
 * 원본 메뉴에 새 항목이 생기면 DEFS 또는 EXCLUDED에 없다고 실패합니다.
 * 그때 음성으로 받을지(DEFS) 제외할지(EXCLUDED)를 정해 주세요.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "public/gbrick-menu.html");
const OUT = path.join(root, "public/voice/menu.json");

// 원본 한 줄(그룹)이 음성 메뉴 여러 개로 갈라지는 경우를 포함한 정의.
// aliases는 띄어쓰기 없이, 손님이 실제로 말하는 형태로 적습니다.
// 두 메뉴에 걸리는 애매한 말(예: "딸기", "생강")은 일부러 넣지 않았습니다. 못 알아들으면 다시 묻습니다.
const DEFS = {
  "에스프레소": [{ id: "espresso", name: "에스프레소", aliases: ["에스프레소"] }],
  "더블 에스프레소": [{ id: "double_espresso", name: "더블 에스프레소", aliases: ["더블에스프레소", "더블샷"] }],
  "스윗 에스프레소": [{ id: "sweet_espresso", name: "스윗 에스프레소", aliases: ["스윗에스프레소", "스위트에스프레소"] }],
  "코코아 에스프레소": [{ id: "cocoa_espresso", name: "코코아 에스프레소", aliases: ["코코아에스프레소"] }],
  "솔티 카라멜 에스프레소": [{ id: "salted_caramel_espresso", name: "솔티 카라멜 에스프레소", aliases: ["솔티카라멜에스프레소"] }],
  "아메리카노 (스페셜티)": [{ id: "americano_specialty", name: "아메리카노 (스페셜티)", aliases: ["스페셜티아메리카노", "아메리카노", "아메"] }],
  "아메리카노 (예가체프)": [{ id: "americano_yirgacheffe", name: "아메리카노 (예가체프)", aliases: ["예가체프아메리카노", "예가체프"] }],
  "카페라떼 / 카푸치노": [
    { id: "latte", name: "카페라떼", aliases: ["카페라떼", "라떼"] },
    { id: "cappuccino", name: "카푸치노", aliases: ["카푸치노"] },
  ],
  "바닐라빈 / 헤이즐넛 / 돌체": [
    { id: "vanilla_bean", name: "바닐라빈", aliases: ["바닐라빈", "바닐라라떼", "바닐라"] },
    { id: "hazelnut", name: "헤이즐넛", aliases: ["헤이즐넛", "헤이즐넛라떼"] },
    { id: "dolce", name: "돌체", aliases: ["돌체", "돌체라떼"] },
  ],
  "카페모카": [{ id: "mocha", name: "카페모카", aliases: ["카페모카", "모카"] }],
  "카라멜 마끼아또": [{ id: "caramel_macchiato", name: "카라멜 마끼아또", aliases: ["카라멜마끼아또", "카라멜마키아또", "캐러멜마끼아또", "마끼아또", "마키아또"] }],
  "아포카토": [{ id: "affogato", name: "아포카토", aliases: ["아포카토"] }],
  "아포카토 라떼": [{ id: "affogato_latte", name: "아포카토 라떼", aliases: ["아포카토라떼"] }],

  "더치 커피": [{ id: "dutch_coffee", name: "더치 커피", aliases: ["더치커피", "더치", "콜드브루"] }],
  "더치 라떼": [{ id: "dutch_latte", name: "더치 라떼", aliases: ["더치라떼"] }],
  "더치 소다": [{ id: "dutch_soda", name: "더치 소다", aliases: ["더치소다"] }],
  "핸드드립 · 스페셜티 블랜딩": [{ id: "handdrip_blend", name: "핸드드립 · 스페셜티 블랜딩", aliases: ["핸드드립", "스페셜티블랜딩", "핸드드립블랜딩"] }],
  "핸드드립 · 케냐 AA / 이디오피아 예가체프": [
    { id: "handdrip_kenya", name: "핸드드립 · 케냐 AA", aliases: ["핸드드립케냐", "케냐핸드드립", "케냐"] },
    { id: "handdrip_yirgacheffe", name: "핸드드립 · 이디오피아 예가체프", aliases: ["핸드드립예가체프", "핸드드립이디오피아", "이디오피아핸드드립"] },
  ],

  "수제 에이드: 레몬 / 자몽 / 오미자 / 패션후르츠": [
    { id: "ade_lemon", name: "레몬 에이드", aliases: ["레몬에이드", "레몬"] },
    { id: "ade_grapefruit", name: "자몽 에이드", aliases: ["자몽에이드", "자몽"] },
    { id: "ade_omija", name: "오미자 에이드", aliases: ["오미자에이드", "오미자"] },
    { id: "ade_passion", name: "패션후르츠 에이드", aliases: ["패션후르츠에이드", "패션후르츠"] },
  ],
  "요거트 플레인 라씨 (스무디)": [{ id: "lassi_plain", name: "플레인 라씨", aliases: ["플레인라씨", "요거트라씨", "라씨"] }],
  "리얼과일 라씨: 딸기 / 망고 / 블루베리": [
    { id: "lassi_strawberry", name: "딸기 라씨", aliases: ["딸기라씨"] },
    { id: "lassi_mango", name: "망고 라씨", aliases: ["망고라씨"] },
    { id: "lassi_blueberry", name: "블루베리 라씨", aliases: ["블루베리라씨"] },
  ],
  "프라페: 자바칩 / 쿠키앤크림": [
    { id: "frappe_javachip", name: "자바칩 프라페", aliases: ["자바칩프라페", "자바칩"] },
    { id: "frappe_cookies", name: "쿠키앤크림 프라페", aliases: ["쿠키앤크림프라페", "쿠키앤크림"] },
  ],

  "말차 라떼": [{ id: "matcha_latte", name: "말차 라떼", aliases: ["말차라떼", "말차"] }],
  "딸기 라떼": [{ id: "strawberry_latte", name: "딸기 라떼", aliases: ["딸기라떼"] }],
  "초코 / 고구마 / 생강 / 12곡 라떼": [
    { id: "choco_latte", name: "초코 라떼", aliases: ["초코라떼", "초콜릿라떼"] },
    { id: "sweetpotato_latte", name: "고구마 라떼", aliases: ["고구마라떼"] },
    { id: "ginger_latte", name: "생강 라떼", aliases: ["생강라떼"] },
    { id: "grain12_latte", name: "12곡 라떼", aliases: ["12곡라떼", "십이곡라떼"] },
  ],
  "리얼과일 주스: 망고 / 블루베리": [
    { id: "juice_mango", name: "망고 주스", aliases: ["망고주스"] },
    { id: "juice_blueberry", name: "블루베리 주스", aliases: ["블루베리주스"] },
  ],
  "토마토 주스": [{ id: "juice_tomato", name: "토마토 주스", aliases: ["토마토주스", "토마토"] }],
  "아이스티": [{ id: "iced_tea", name: "아이스티", aliases: ["아이스티"] }],
  "브라운 버블티": [{ id: "brown_bubble_tea", name: "브라운 버블티", aliases: ["브라운버블티", "버블티"] }],
  "유자 + 민트": [{ id: "yuzu_mint", name: "유자 + 민트", aliases: ["유자민트"] }],

  "허브티: 캐모마일 / 페퍼민트 / 녹차": [
    { id: "herb_chamomile", name: "캐모마일 허브티", aliases: ["캐모마일"] },
    { id: "herb_peppermint", name: "페퍼민트 허브티", aliases: ["페퍼민트"] },
    { id: "herb_greentea", name: "녹차 (허브티)", aliases: ["녹차", "녹차티"] },
  ],
  "운남성 보이차": [{ id: "puerh", name: "운남성 보이차", aliases: ["보이차", "운남성보이차"] }],
  "수제티: 생자몽 / 오미자 / 레몬 / 유자 / 진저": [
    { id: "tea_grapefruit", name: "생자몽 수제티", aliases: ["생자몽티", "생자몽차", "자몽차", "자몽티"] },
    { id: "tea_omija", name: "오미자 수제티", aliases: ["오미자차", "오미자티"] },
    { id: "tea_lemon", name: "레몬 수제티", aliases: ["레몬차", "레몬티"] },
    { id: "tea_yuzu", name: "유자 수제티", aliases: ["유자차", "유자티"] },
    { id: "tea_ginger", name: "진저 수제티", aliases: ["생강차", "진저티", "진저차"] },
  ],
};

// 음성 주문에서 일부러 뺀 항목과 이유 (원본 메뉴에는 그대로 있음)
const EXCLUDED = {
  "밀크티": "동절기 한정 — 제공 기간을 대표가 정해 주셔야 함",
  "뱅쇼": "동절기 한정 — 제공 기간을 대표가 정해 주셔야 함",
  "수제 팥빙수": "하절기 한정 — 제공 기간을 대표가 정해 주셔야 함",
  "망고빙수": "하절기 한정 — 제공 기간을 대표가 정해 주셔야 함",
  "콜드브루 원액 750ml": "병 판매 상품",
  "에그타르트": "원본에 가격이 없음",
  "마카롱": "원본에 가격이 없음",
  "미니 베이커리": "원본에 가격이 없음",
  "쿠키": "원본에 가격이 없음",
};
const EXCLUDED_CATEGORIES = { extra: "추가 옵션(샷 추가 등)은 아직 음성 주문이 지원하지 않음" };

// 손님 사이에서 굳은 줄임말 (id는 위 DEFS와 같아야 함)
const SPECIAL_ALIASES = [
  { alias: "아아", id: "americano_specialty", temp: "ice" },
  { alias: "따아", id: "americano_specialty", temp: "hot" },
];

function loadSource() {
  const html = fs.readFileSync(SRC, "utf8");
  const tFn = html.match(/function t\(ko[^\n]*\n/);
  const items = html.match(/var ITEMS = \[[\s\S]*?\n\];/);
  if (!tFn || !items) throw new Error("gbrick-menu.html에서 ITEMS를 찾지 못했습니다. 파일 구조가 바뀌었는지 확인해 주세요.");
  return vm.runInNewContext(tFn[0] + items[0] + ";ITEMS");
}

export function build() {
  const source = loadSource();
  const out = [];
  const seenAlias = new Map();
  const used = new Set();
  const problems = [];

  for (const it of source) {
    const ko = it.n.ko;
    if (EXCLUDED[ko] || EXCLUDED_CATEGORIES[it.c]) continue;
    const defs = DEFS[ko];
    if (!defs) { problems.push(`원본 메뉴 "${ko}" 이(가) DEFS/EXCLUDED에 없습니다`); continue; }
    used.add(ko);
    const prices = {};
    if (typeof it.p === "number") prices.one = it.p;          // 단일 가격 = 온도 구분 없는 메뉴(에스프레소 등). 핫/아이스로 지어내지 않는다.
    if (typeof it.h === "number") prices.hot = it.h;
    if (typeof it.i === "number") prices.ice = it.i;
    const temps = Object.keys(prices);
    if (!temps.length) { problems.push(`"${ko}" 에 가격이 없습니다`); continue; }
    for (const d of defs) {
      for (const a of d.aliases) {
        if (seenAlias.has(a) && seenAlias.get(a) !== d.id) problems.push(`별칭 "${a}" 이(가) ${seenAlias.get(a)} 와 ${d.id} 에 겹칩니다`);
        seenAlias.set(a, d.id);
      }
      out.push({ id: d.id, name: d.name, category: it.c, prices, temps, defaultTemp: temps[0], aliases: d.aliases });
    }
  }
  for (const k of Object.keys(DEFS)) if (!used.has(k)) problems.push(`DEFS의 "${k}" 이(가) 원본 메뉴에 없습니다 (이름이 바뀌었거나 삭제됨)`);
  for (const k of Object.keys(EXCLUDED)) if (!source.some((s) => s.n.ko === k)) problems.push(`EXCLUDED의 "${k}" 이(가) 원본 메뉴에 없습니다`);
  const ids = new Set(out.map((o) => o.id));
  for (const s of SPECIAL_ALIASES) if (!ids.has(s.id)) problems.push(`특수 별칭 "${s.alias}" 의 id ${s.id} 가 없습니다`);

  const menu = {
    store: "GBRICK Coffee",
    note: "자동 생성 파일입니다. 직접 고치지 말고 public/gbrick-menu.html 또는 scripts/build-voice-menu.mjs 를 고친 뒤 node scripts/build-voice-menu.mjs 를 실행하세요.",
    items: out,
    specialAliases: SPECIAL_ALIASES,
  };
  return { menu, problems, excluded: EXCLUDED };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { menu, problems } = build();
  if (problems.length) { console.error("메뉴 변환 실패:\n- " + problems.join("\n- ")); process.exit(1); }
  const text = JSON.stringify(menu, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (cur !== text) { console.error("public/voice/menu.json 이 원본 메뉴와 다릅니다. node scripts/build-voice-menu.mjs 를 실행하세요."); process.exit(1); }
    console.log(`OK: 음성 메뉴 ${menu.items.length}개가 원본과 일치합니다.`);
  } else {
    fs.writeFileSync(OUT, text);
    console.log(`public/voice/menu.json 생성: ${menu.items.length}개 메뉴`);
  }
}
