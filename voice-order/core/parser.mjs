// 자연어 주문 분석기 — 규칙 기반, 외부 API 없음.
// 원칙: 추측해서 주문하지 않는다. 애매하면 needs_confirm / 온도 미정으로 남겨 고객에게 묻는다.
// 가격은 다루지 않는다. 가격은 서버가 MENU_MASTER(data/menu.json)에서만 붙인다.

const ICE_STEMS = ['아이스', '차가', '차갑', '시원', '냉', '찬'];
const HOT_STEMS = ['따뜻', '따듯', '뜨거', '뜨겁', '따끈', '뜨끈', '핫', '뜨신', '따신', '따순', '뜨순'];

// 메뉴 이름 앞에 붙어 오면 "없는 메뉴"로 판단하는 단어 (딸기라떼, 녹차 라떼, 인절미 빙수 …)
const NON_MENU_FLAVORS = [
  '딸기', '녹차', '말차', '초코', '초콜릿', '고구마', '자몽', '유자', '흑당', '카라멜', '캐러멜',
  '헤이즐넛', '민트', '오트', '두유', '망고', '블루베리', '복숭아', '수박', '쑥', '인절미', '콩',
  '곡물', '토피넛', '밀크티', '연유', '돌체', '시나몬', '꿀', '허니', '모카', '카푸치노', '과일',
];

// 메뉴 이름 없이 "따뜻한 거 뭐 있어요?" / "뭘 마시면 될까" → 메뉴판에서 고를 보기를 보여준다
// "커피 말고 / 커피 아닌 거 / 카페인 없는" → 커피를 빼고 보여준다
const NOT_COFFEE_RE = /(?:커피|카페인)\s*(?:가|는|를|은|이)?\s*(?:아닌|아니고|말고|빼고|없는|없이|안\s*들어|안\s*마시|못\s*마시|싫|안\s*좋)/;
// "차 종류 / 따뜻한 차 / 티 뭐 있어요" → 차만 보여준다 ("차가운"의 '차'는 제외)
const TEA_RE = /(?:^|\s)(?:전통\s*)?(?:차|티|허브티)(?=$|\s|종류|는|로|도|를|좀|요|가(?:\s|$)|나|라도)/;

const SUGGEST_RE = /(종류|음료|마실\s*(?:거|것|게)|먹을\s*(?:거|것|게)|뭐|뭘|무엇|무슨|어떤|어느|추천|메뉴|있어|있나|있습니까|있어요|좋을까|될까|골라|맛있는)/;

const NUM_WORDS = {
  하나: 1, 둘: 2, 셋: 3, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10,
  한: 1, 두: 2, 세: 3, 석: 3, 네: 4, 서: 3, 너: 4,
};
// "한/두/세/네"는 "주세요"·"네(대답)"와 헷갈리므로 단위(잔/개)가 붙을 때만 수량으로 본다.
const QTY_RE = /(?:^|\s)(?:(\d{1,2})\s*(?:잔|개|그릇|컵)?|(하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열)(?:\s*(?:잔|개|그릇|컵))?|(한|두|세|석|네|서|너)\s*(?:잔|개|그릇|컵))/;
const CONNECTOR_RE = /(하고|이랑|그리고|랑|,|및|(?:^|\s)또(?:\s|$)|(?<=\S)(?:와|과)(?:\s|$))/;

// 남은 단어 중 주문과 무관한 말(인사·조사·존댓말)
const FILLER_WORDS = new Set([
  '여기', '저기', '여기요', '저기요', '사장님', '그거', '이거', '저거', '좀', '그리고', '그럼', '그러면',
  '네', '예', '음', '어', '아', '저', '제가', '저는', '나는', '나', '우리', '주문', '그냥', '일단', '우선',
  '먼저', '같이', '포장', '매장', '테이크아웃', '먹고', '갈게요', '가져갈게요', '안녕하세요', '하나만',
  '거', '것', '걸', '잔', '개', '컵', '그릇', '하고', '랑', '이랑', '또', '더', '다', '씩', '로', '으로',
  '안녕', '감사합니다', '고맙습니다', '부탁', '주시고', '주고', '할게요', '할께요', '마실게요', '먹을게요',
  '드릴게요', '줘', '줘요', '주세요', '해주세요', '해', '해요', '주실래요', '주라', '할래요', '하겠습니다',
]);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 별칭을 공백 무시 정규식으로: "바닐라라떼" ↔ "바닐라 라떼" */
function aliasPattern(alias) {
  return [...alias.replace(/\s+/g, '')].map(escapeRe).join('\\s*');
}

function buildMatchers(menu) {
  const list = [];
  for (const item of menu.items) {
    for (const a of item.aliases || []) list.push({ text: a, item, generic: false });
    list.push({ text: item.name, item, generic: false });
    for (const g of item.suggest_for || []) list.push({ text: g, item, generic: true });
  }
  const seen = new Set();
  return list
    .filter((m) => {
      const key = m.text.replace(/\s+/g, '') + '|' + m.generic;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.text.replace(/\s+/g, '').length - a.text.replace(/\s+/g, '').length)
    .map((m) => ({ ...m, re: new RegExp(aliasPattern(m.text), 'y') }));
}

function findMentions(text, matchers) {
  const mentions = [];
  let i = 0;
  while (i < text.length) {
    let hit = null;
    for (const m of matchers) {
      m.re.lastIndex = i;
      const r = m.re.exec(text);
      if (r) {
        hit = { matcher: m, start: i, end: i + r[0].length, raw: r[0] };
        break;
      }
    }
    if (hit) {
      mentions.push(hit);
      i = hit.end;
    } else {
      i += 1;
    }
  }
  return mentions;
}

function hasStem(region, stems) {
  return stems.some((s) => new RegExp(`(?:^|\\s)${escapeRe(s)}`).test(region));
}

export function detectTemperature(region) {
  const ice = hasStem(region, ICE_STEMS);
  const hot = hasStem(region, HOT_STEMS);
  if (ice && !hot) return 'ICE';
  if (hot && !ice) return 'HOT';
  return null; // 없음 또는 둘 다(모순) → 묻는다
}

function parseQty(region) {
  const m = QTY_RE.exec(region);
  if (!m) return null;
  const n = m[1] ? parseInt(m[1], 10) : NUM_WORDS[m[2] || m[3]];
  return { n, start: m.index, end: m.index + m[0].length };
}

/** 메뉴 이름 바로 앞 단어가 메뉴에 없는 맛 이름이면 그 메뉴 전체를 "없는 메뉴"로 본다. */
function unknownPrefix(text, mention, regionStart) {
  const before = text.slice(regionStart, mention.start);
  const glued = before.match(/(\S+)$/); // 공백 없이 붙은 앞말: "딸기라떼"
  const spaced = before.match(/(\S+)\s+$/); // 띄어 쓴 앞말: "딸기 라떼"
  const word = glued ? glued[1] : spaced ? spaced[1] : '';
  if (!word) return null;
  const flavor = NON_MENU_FLAVORS.find((f) => word === f || word.endsWith(f));
  if (flavor) return `${flavor}${glued ? '' : ' '}${mention.raw}`;
  if (glued && /^[가-힣]{2,}$/.test(word) && !isBenignPrefix(word)) return `${word}${mention.raw}`;
  return null;
}

function isBenignPrefix(word) {
  if (detectTemperature(word)) return true;
  if (/^(하나|둘|셋)?(하고|이랑|랑|그리고|또)$/.test(word)) return true;
  return FILLER_WORDS.has(word);
}

function normalize(text) {
  return String(text || '')
    .replace(/[.?!~·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 메뉴로 해석되지 않고 남은 의미 있는 단어들 (예: "카푸치노") */
function leftoverWords(text, mentions) {
  let rest = text;
  for (const m of [...mentions].reverse()) rest = rest.slice(0, m.start) + ' ' + rest.slice(m.end);
  return rest
    .split(/[\s,]+/)
    .map((w) => w.replace(/(이에요|예요|이요|해\s*주세요|주세요|주시고|주실래요|줘요|줘|할게요|할께요|하고|이랑|랑|으로|로|요)$/, ''))
    .filter((w) => /[가-힣a-zA-Z]{2,}/.test(w))
    .filter((w) => !FILLER_WORDS.has(w))
    .filter((w) => !detectTemperature(w))
    .filter((w) => !parseQty(w))
    .filter((w) => !/^(\d+|하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열)(잔|개|컵|그릇)?$/.test(w))
    .filter((w) => !/^(한|두|세|네|석)(잔|개|컵|그릇)$/.test(w));
}

/**
 * 주문 문장을 분석한다.
 * @returns {{
 *   kind: 'ok'|'clarify'|'not_found'|'unavailable'|'unclear',
 *   items: Array<{menu_id,name,unit,temperature,quantity,needs_confirm,temperature_unavailable,heard}>,
 *   unknown: string[],       // 메뉴에 없는 것이 확실한 이름 → 주문을 막는다
 *   unavailable: string[],   // 메뉴에는 있으나 판매 중지
 *   unrecognized: string[],  // 알아듣지 못한 단어 → 확인 화면에 함께 보여준다
 * }}
 */
export function parseOrder(rawText, menu) {
  let text = normalize(rawText);
  const result = { kind: 'unclear', items: [], unknown: [], unavailable: [], unrecognized: [] };
  if (!text) return result;
  const notCoffee = NOT_COFFEE_RE.exec(text);
  if (notCoffee) text = (text.slice(0, notCoffee.index) + ' ' + text.slice(notCoffee.index + notCoffee[0].length)).trim();

  const found = findMentions(text, buildMatchers(menu));
  let cursor = 0; // 이전 메뉴가 차지한 영역의 끝

  // "고구마 아메리카노"처럼 메뉴 이름 둘이 연결어·수량 없이 바로 붙으면 두 잔이 아니라 없는 메뉴 하나다
  const mentions = [];
  for (const m of found) {
    const prev = mentions.at(-1);
    if (prev && /^\s*$/.test(text.slice(prev.end, m.start))) {
      prev.compound = `${prev.compound || prev.raw} ${m.raw}`;
      prev.end = m.end;
    } else {
      mentions.push({ ...m });
    }
  }

  mentions.forEach((m, idx) => {
    const nextStart = idx + 1 < mentions.length ? mentions[idx + 1].start : text.length;
    const unknownName = m.compound || unknownPrefix(text, m, cursor);

    // 메뉴 뒤쪽에서 이 메뉴의 몫: 수량까지, 없으면 연결어(하고/랑) 앞까지
    const suffix = text.slice(m.end, nextStart);
    const qty = parseQty(suffix);
    const conn = CONNECTOR_RE.exec(suffix);
    let ownEnd;
    if (qty && (!conn || qty.start <= conn.index)) ownEnd = qty.end;
    else if (conn) ownEnd = conn.index;
    else ownEnd = idx + 1 < mentions.length ? 0 : suffix.length;
    const prefix = text.slice(cursor, m.start);
    const own = `${prefix} ${suffix.slice(0, ownEnd)}`;
    cursor = m.end + (conn && (!qty || conn.index < qty.start) ? conn.index + conn[0].length : ownEnd);

    if (unknownName) {
      result.unknown.push(unknownName.trim());
      return;
    }
    const item = m.matcher.item;
    if (item.available === false) {
      result.unavailable.push(item.name);
      return;
    }

    const prefixQty = qty ? null : parseQty(prefix);
    const quantity = qty ? qty.n : prefixQty ? prefixQty.n : 1;
    const allowed = item.options?.temperature || [];
    let temperature = allowed.length ? detectTemperature(`${own} ${m.raw}`) : null; // "핫초코"처럼 이름에 온도가 들어간 경우 포함
    let temperatureUnavailable = null;
    if (temperature && !allowed.includes(temperature)) {
      temperatureUnavailable = temperature; // 예: 따뜻한 레몬 아메리카노 → "아이스만 있어요"
      temperature = null;
    } else if (!temperature && allowed.length === 1) {
      temperature = allowed[0]; // 선택지가 하나뿐이면 추측이 아니다
    }

    result.items.push({
      menu_id: item.menu_id,
      name: item.name,
      unit: item.unit,
      temperature,
      quantity,
      needs_confirm: m.matcher.generic, // "커피" → "아메리카노를 말씀하시나요?"
      temperature_unavailable: temperatureUnavailable,
      heard: m.raw,
    });
  });

  result.unrecognized = leftoverWords(text, mentions).filter(
    (w) => !result.unknown.some((u) => u.replace(/\s/g, '').includes(w)),
  );

  if (result.unknown.length) result.kind = 'not_found';
  else if (result.unavailable.length) result.kind = 'unavailable';
  else if (!result.items.length && (SUGGEST_RE.test(text) || detectTemperature(text) || notCoffee || TEA_RE.test(text))) {
    // 추측해서 담지 않는다. 메뉴판에 있는 것 중에서 고르게 한다.
    const temperature = detectTemperature(text);
    const category = TEA_RE.test(text) ? 'TEA' : null;
    result.kind = 'suggest';
    result.temperature = temperature;
    result.not_coffee = !!notCoffee;
    result.category = category;
    result.suggestions = menu.items
      .filter((m) => m.available !== false)
      .filter((m) => !temperature || (m.options?.temperature || []).includes(temperature))
      .filter((m) => !notCoffee || m.category !== 'COFFEE')
      .filter((m) => !category || m.category === category)
      .map((m) => ({ menu_id: m.menu_id, name: m.name, category: m.category, price: m.price }));
    result.unrecognized = [];
  }
  else if (!result.items.length) result.kind = result.unrecognized.length ? 'not_found' : 'unclear';
  else if (result.items.some(needsQuestion(menu))) result.kind = 'clarify';
  else result.kind = 'ok';
  return result;
}

function needsQuestion(menu) {
  return (it) => {
    if (it.needs_confirm || it.temperature_unavailable) return true;
    const def = menu.items.find((x) => x.menu_id === it.menu_id);
    return (def?.options?.temperature || []).length > 1 && !it.temperature;
  };
}
