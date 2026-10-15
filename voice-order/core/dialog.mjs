// 확인 질문과 고객 대답 해석. 브라우저와 Node(테스트) 양쪽에서 쓴다.
import { itemLabel, josa, temperatureLabel } from './format.mjs';
import { detectTemperature } from './parser.mjs';

/**
 * 아직 고객에게 물어봐야 할 첫 번째 질문. 없으면 null (→ 주문 확인 단계).
 * @param items parseOrder().items
 * @param menu  MENU_MASTER
 */
export function nextQuestion(items, menu) {
  for (let index = 0; index < items.length; index++) {
    const it = items[index];
    const allowed = menu.items.find((m) => m.menu_id === it.menu_id)?.options?.temperature || [];

    if (it.needs_confirm) {
      const label = itemLabel(it.name, it.temperature);
      return { type: 'confirm_item', index, text: `${josa(label, '을', '를')} 말씀하시나요?` };
    }
    if (it.temperature_unavailable) {
      const only = temperatureLabel(allowed[0]);
      return {
        type: 'temp_unavailable',
        index,
        text: `${josa(it.name, '은', '는')} ${only}만 있어요. ${only}로 드릴까요?`,
      };
    }
    if (allowed.length > 1 && !it.temperature) {
      return {
        type: 'choose_temperature',
        index,
        text: `${josa(it.name, '은', '는')} 따뜻한 것과 차가운 것 중 어떤 걸로 드릴까요?`,
      };
    }
  }
  return null;
}

/** 대답을 질문에 반영한 새 items. 'no' 이면 null (→ 처음부터 다시 말하기). */
export function applyAnswer(items, question, answer, menu) {
  const next = items.map((it) => ({ ...it }));
  const it = next[question.index];
  if (question.type === 'choose_temperature') {
    if (answer !== 'HOT' && answer !== 'ICE') return items; // 못 알아들음 → 같은 질문 유지
    it.temperature = answer;
    return next;
  }
  if (answer === 'no') return null;
  if (answer !== 'yes' && answer !== 'HOT' && answer !== 'ICE') return items;
  if (question.type === 'confirm_item') {
    it.needs_confirm = false;
    if (answer === 'HOT' || answer === 'ICE') it.temperature = answer; // "네, 따뜻한 걸로"
  } else if (question.type === 'temp_unavailable') {
    const allowed = menu.items.find((m) => m.menu_id === it.menu_id)?.options?.temperature || [];
    it.temperature = allowed[0];
    it.temperature_unavailable = null;
  }
  return next;
}

export const CATEGORY_LABEL = { COFFEE: '커피', DRINK: '라떼·음료', TEA: '차', DESSERT: '빙수' };
const MAX_SPOKEN = 9; // 음성으로 다 읽어 주는 최대 개수
export const MAX_DIRECT_CHOICES = 6; // 이보다 많으면 먼저 종류(커피/차/라떼·음료)를 고르게 한다

/** 보기가 너무 많으면 종류별로 묶는다. 묶을 필요 없으면 null */
export function groupSuggestions(suggestions) {
  const cats = [...new Set(suggestions.map((x) => x.category))];
  if (suggestions.length <= MAX_DIRECT_CHOICES || cats.length < 2) return null;
  return cats.map((c) => ({ category: c, label: CATEGORY_LABEL[c] || c, count: suggestions.filter((x) => x.category === c).length }));
}

/** "차요" / "라떼 종류" / "커피" → 카테고리 */
export function interpretCategory(text) {
  const t = String(text || '');
  if (/(?:^|\s)(?:차|티)(?!가|갑)|녹차|허브/.test(t)) return 'TEA';
  if (/라떼|라테|음료|드링크|주스/.test(t)) return 'DRINK';
  if (/커피/.test(t)) return 'COFFEE';
  if (/빙수|디저트/.test(t)) return 'DESSERT';
  return null;
}

function headPhrase(r) {
  const t = r.temperature === 'HOT' ? '따뜻하게 드실 수 있는' : r.temperature === 'ICE' ? '시원하게 드실 수 있는' : '주문하실 수 있는';
  return r.not_coffee ? `${t} 커피 아닌 메뉴는` : `${t} 메뉴는`;
}

/** 종류를 먼저 고르게 할 때의 안내 문장 */
export function categoryText(r, groups) {
  return `${headPhrase(r)} ${groups.map((g) => g.label).join(', ')} 종류가 있어요. 어떤 종류로 보여드릴까요?`;
}

/** 추천 보기 안내 문장: "따뜻하게 드실 수 있는 메뉴는 아메리카노, 카페라떼가 있어요. 어떤 걸로 드릴까요?" */
export function suggestionText(r, suggestions = r.suggestions) {
  const head = headPhrase(r);
  if (suggestions.length > MAX_SPOKEN) {
    // 너무 길면 다 읽지 않는다. 몇 가지만 말하고 나머지는 화면 버튼으로
    const few = suggestions.slice(0, 4).map((x) => x.name).join(', ');
    return `${head} ${few} 등 ${suggestions.length}가지가 있어요. 화면에서 골라 주시거나 메뉴 이름을 말씀해 주세요.`;
  }
  const names = suggestions.map((x) => x.name).join(', ');
  return `${head} ${josa(names, '이', '가')} 있어요. 어떤 걸로 드릴까요?`;
}

const NO_RE = /(아니|아뇨|아녜|틀려|틀렸|다시|취소|안\s*돼|싫어|노우?$|^노\b)/;
const YES_RE = /(^|\s)(네|넵|넹|예|응|어|엉|그래|그럼요|맞아|맞습|맞네|맞어|좋아|좋습|오케이|okay|ok|그렇|주세요|해\s*주세요|부탁)/i;

/**
 * 고객 대답 → 'yes' | 'no' | 'HOT' | 'ICE' | null
 * 온도를 말하면 온도가 우선이다 ("네, 아이스로요" → ICE).
 */
export function interpretAnswer(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  if (NO_RE.test(t)) return 'no';
  const temp = detectTemperature(t);
  if (temp) return temp;
  if (YES_RE.test(t)) return 'yes';
  return null;
}
