// 메뉴 지식 문서(data/knowledge.json)와 메뉴 설명(menu.json description)으로 손님 질문에 답한다.
// 원칙: 문서에 적힌 사실만 말한다. 비어 있으면 '아직 몰라요'로 답하고 기록한다 (kind: 'unanswered').
// 판매 순위는 데이터가 없으므로 절대 말하지 않는다 — '매장 추천 메뉴'만 말한다.
import { josa } from './format.mjs';

// "많이 팔리는 게 뭐예요?" / "인기 메뉴" / "뭐가 맛있어요?"
const POPULAR_RE = /(많이\s*팔|잘\s*팔|잘\s*나가|인기|베스트|제일\s*많이|많이\s*찾|많이\s*먹|많이\s*마시|시그니처|대표\s*메뉴|뭐가\s*맛있|제일\s*맛있|맛있는\s*(?:거|게|것))/;
const RECOMMEND_RE = /추천/;
// "프라페가 뭐예요?" / "라씨는 뭐 들어가요?"
const DESCRIBE_RE = /(뭐야|뭐예요|뭐에요|뭔가요|뭔데|뭐죠|무엇인가요|어떤\s*(?:거|건|맛)|무슨\s*맛|들어가|들어있|들어 있|뭐\s*들|뭘로\s*만들|어떻게\s*만들)/;

const PARTICLE_RE = /(이에요|예요|이야|야|은|는|이|가|을|를|도|요|랑|하고|에는|에)$/;

function available(menu, ids) {
  return ids
    .map((id) => menu.items.find((m) => m.menu_id === id))
    .filter((m) => m && m.available !== false);
}

function toSuggestion(m) {
  return { menu_id: m.menu_id, name: m.name, category: m.category, price: m.price };
}

function unanswered(topic, reason) {
  return {
    kind: 'unanswered',
    topic,
    reason,
    answer: '죄송해요. 그 내용은 제가 아직 잘 몰라요.\n직원에게 물어봐 주시겠어요?',
  };
}

/** "프라페가 뭐예요?" → 이름에 그 말이 들어간 메뉴들 */
function findNamed(text, menu) {
  const words = text
    .split(/[\s,?.!]+/)
    .map((w) => w.replace(PARTICLE_RE, ''))
    .filter((w) => /^[가-힣a-zA-Z0-9]{2,}$/.test(w));
  const namesOf = (m) => [m.name, ...(m.aliases || [])].map((n) => n.replace(/\s+/g, ''));
  // 이름이 정확히 같은 메뉴가 있으면 그것만 ("에스프레소" → 에스프레소, 더블 에스프레소는 빼고)
  const exact = menu.items.filter((m) => words.some((w) => namesOf(m).includes(w)));
  if (exact.length) return exact;
  return menu.items.filter((m) =>
    words.some((w) => !/^(커피|음료|라떼|라테|메뉴|에이드|주스|차)$/.test(w) && namesOf(m).some((n) => n.includes(w))),
  );
}

function spokenDescription(m) {
  const parts = m.description.split(/\s*\+\s*/).map((x) => x.replace(/\s*\(.*?\)\s*/g, '').trim());
  if (/[.요다]$/.test(m.description.trim())) return `${m.name}: ${m.description.trim()}`; // 이미 문장이면 그대로
  if (parts.length > 1) return `${m.name}에는 ${josa(parts.join(', '), '이', '가')} 들어가요`;
  return `${josa(m.name, '은', '는')} ${m.description}이에요`;
}

/**
 * 손님 말이 '질문'이면 답을 만든다. 주문이면 null (→ 원래 주문 분석으로).
 * @param parsed parseOrder() 결과 — 이미 메뉴를 확실히 담은 주문이면 질문으로 보지 않는다
 */
export function answerFromKnowledge(text, menu, knowledge, parsed) {
  const t = String(text || '');
  const k = knowledge || {};
  const orderedSomething = parsed && (parsed.kind === 'ok' || (parsed.kind === 'clarify' && parsed.items.some((i) => !i.needs_confirm)));

  // 1) 특징 태그: "얼음 갈리는 음료", "카페인 없는 거"
  for (const tag of k.tags || []) {
    if (!(tag.keywords || []).some((kw) => t.includes(kw))) continue;
    const items = available(menu, tag.menu_ids || []);
    if (!items.length) return unanswered(tag.label, `태그 '${tag.id}'에 메뉴가 아직 없음`);
    return {
      kind: 'suggest',
      title: `${tag.label}예요.\n어떤 걸로 드릴까요?`,
      speech: `${tag.label}는 ${items.map((m) => m.name).join(', ')}가 있어요. 어떤 걸로 드릴까요?`,
      suggestions: items.map(toSuggestion),
      temperature: null,
      source: `tag:${tag.id}`,
    };
  }

  // 2) 자주 묻는 질문
  for (const f of k.faq || []) {
    if ((f.match || []).some((w) => t.includes(w)) && f.answer) {
      return { kind: 'info', answer: f.answer, source: 'faq' };
    }
  }

  // 3) 메뉴 설명 (주문보다 먼저: "유자차는 뭐 들어가요?"는 주문이 아니라 질문): "프라페가 뭐예요?"
  const named = DESCRIBE_RE.test(t) && !POPULAR_RE.test(t) ? findNamed(t, menu) : [];
  if (named.length) {
    const described = named.filter((m) => m.description).slice(0, 4);
    if (!described.length) return unanswered(`${named[0].name} 설명`, '메뉴 설명이 아직 없음');
    return {
      kind: 'info',
      answer: described.map((m) => `${m.name}: ${m.description}`).join('\n'),
      speech: described.map(spokenDescription).join('. '),
      source: 'description',
    };
  }
  if (orderedSomething) return null;

  // 4) 인기·추천: 판매 순위는 모른다고 먼저 말한다
  const popular = POPULAR_RE.test(t);
  if (popular || (RECOMMEND_RE.test(t) && !parsed?.temperature && !parsed?.not_coffee && !parsed?.category)) {
    const items = available(menu, k.recommended?.menu_ids || []);
    if (!items.length) {
      return popular ? unanswered('인기·추천 메뉴', '추천 메뉴가 아직 없음 (판매 데이터도 없음)') : null; // 그냥 "추천"이면 메뉴 보기로
    }
    const head = popular ? '판매 순위는 아직 모으지 않았어요. 대신 ' : '';
    return {
      kind: 'suggest',
      title: '저희 매장 추천 메뉴예요.\n어떤 걸로 드릴까요?',
      speech: `${head}저희 매장 추천 메뉴는 ${items.map((m) => m.name).join(', ')}예요. 어떤 걸로 드릴까요?`,
      suggestions: items.map(toSuggestion),
      temperature: null,
      source: 'recommended',
    };
  }

  return null;
}
