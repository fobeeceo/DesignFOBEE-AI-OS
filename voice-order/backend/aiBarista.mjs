// AI 바리스타 (Gemini) — 규칙형이 알아듣지 못한 말만 AI에게 묻는다. 대표 승인 2026-10-26 (기존 GEMINI_API_KEY 사용).
// 원칙: AI는 '말'만 한다. 메뉴는 menu.json에 있는 menu_id만 받고, 가격은 말하지 않으며(서버 quote가 계산),
// 주문은 기존 확인 화면에서 손님이 "네"라고 해야 들어간다. 실패·시간 초과면 규칙형 결과를 그대로 쓴다.
// 키는 이 서버(매장 PC)에서만 읽는다 — 손님 화면·응답·로그에 절대 싣지 않는다.
import { maskPersonal } from './orderService.mjs';

export const DEFAULT_API_BASE = 'https://generativelanguage.googleapis.com';
// 앞에서부터 이 키로 쓸 수 있는 첫 모델을 고른다 (가장 빠르고 저렴한 Flash-Lite 우선). VOICE_ORDER_AI_MODEL로 지정 가능
export const MODEL_PREFERENCE = ['gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
const TIMEOUT_MS = 7000;
const MAX_TURNS = 8; // 기억하는 최근 대화 수
const PRICE_RE = /[^.!?。]*\d[\d,]*\s*원[^.!?。]*[.!?。]?/g; // 가격을 말한 문장은 지운다 (가격은 화면·서버가 말한다)

function systemPrompt(menu, knowledge) {
  const lines = menu.items
    .filter((m) => m.available !== false)
    .map((m) => {
      const t = m.options?.temperature?.join('/') || '-';
      const alias = (m.aliases || []).slice(0, 4).join(', ');
      const desc = m.description ? ` / ${String(m.description).slice(0, 40)}` : '';
      return `${m.menu_id} | ${m.name} | ${m.category} | ${t}${alias ? ` | 다른 이름: ${alias}` : ''}${desc}`;
    })
    .join('\n');
  const off = menu.items.filter((m) => m.available === false).map((m) => m.name).join(', ');
  const facts = knowledge && Object.keys(knowledge).length ? JSON.stringify(knowledge).slice(0, 1500) : '';
  return `너는 GBRICK Coffee 매장의 친절한 바리스타다. 손님은 주로 어르신이다.
규칙:
1. 존댓말로, 한두 문장으로 짧고 쉽게 말한다. 한 번에 하나만 묻는다.
2. 아래 메뉴판에 있는 메뉴만 권하고 담는다. 메뉴판에 없는 메뉴·맛·옵션은 절대 만들지 않는다. 없으면 "지금은 없어요"라고 하고 비슷한 메뉴판 메뉴를 권한다.
3. 가격·할인 금액은 말하지 않는다 ("가격은 화면에 나와요").
4. 손님이 주문하면 items에 menu_id·온도·수량을 넣는다. 온도를 말하지 않았으면 temperature는 null (시스템이 다시 묻는다). 확실하지 않으면 items를 비우고 짧게 되묻는다.
5. 매장에서 먹는지 포장인지 말했으면 dining에 넣고, 아니면 null.
6. 건강·의학적 효과는 말하지 않는다. 메뉴판·매장 정보에 없는 사실은 지어내지 않는다.
7. 손님이 직원을 찾거나 화가 났거나 어려워하면 wants_help를 true로 한다.
8. 잡담에는 짧게 답하고 주문으로 자연스럽게 이끈다.
메뉴판 (menu_id | 이름 | 종류 | 온도 | 다른 이름 / 설명):
${lines}
${off ? `지금 판매하지 않는 메뉴: ${off}\n` : ''}${facts ? `매장 정보(대표가 쓴 사실만): ${facts}\n` : ''}`;
}

function responseSchema(menu) {
  const ids = menu.items.filter((m) => m.available !== false).map((m) => m.menu_id);
  return {
    type: 'OBJECT',
    properties: {
      say: { type: 'STRING' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            menu_id: { type: 'STRING', enum: ids },
            temperature: { type: 'STRING', enum: ['HOT', 'ICE'], nullable: true },
            quantity: { type: 'INTEGER' },
          },
          required: ['menu_id', 'quantity'],
        },
      },
      dining: { type: 'STRING', enum: ['DINE_IN', 'TAKEOUT'], nullable: true },
      wants_help: { type: 'BOOLEAN' },
    },
    required: ['say', 'items'],
  };
}

function thinkingConfig(model) {
  if (/^gemini-3/.test(model)) return { thinkingLevel: 'low' }; // 빠르게: 생각은 최소로
  if (/^gemini-2\.5/.test(model)) return { thinkingBudget: 0 };
  return null; // -latest 별칭은 모델이 바뀔 수 있어 건드리지 않는다
}

/** AI가 돌려준 메뉴를 메뉴판으로 검증 → 규칙형 parseOrder와 같은 모양의 items. 메뉴판에 없는 건 버린다 */
export function validateAiItems(raw, menu) {
  const out = [];
  const dropped = [];
  for (const r of Array.isArray(raw) ? raw : []) {
    const def = menu.items.find((m) => m.menu_id === r?.menu_id);
    if (!def || def.available === false) {
      dropped.push(String(r?.menu_id || '?'));
      continue;
    }
    const allowed = def.options?.temperature || [];
    let temperature = allowed.length && ['HOT', 'ICE'].includes(r.temperature) ? r.temperature : null;
    let temperatureUnavailable = null;
    if (temperature && !allowed.includes(temperature)) {
      temperatureUnavailable = temperature;
      temperature = null;
    } else if (!temperature && allowed.length === 1) temperature = allowed[0];
    const q = Number.isInteger(r.quantity) ? r.quantity : parseInt(r.quantity, 10);
    out.push({
      menu_id: def.menu_id,
      name: def.name,
      unit: def.unit,
      temperature,
      quantity: Math.min(20, Math.max(1, Number.isFinite(q) ? q : 1)),
      needs_confirm: false,
      temperature_unavailable: temperatureUnavailable,
      heard: 'AI',
    });
  }
  return { items: out, dropped };
}

export function cleanSay(text) {
  const s = String(text || '').replace(PRICE_RE, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 200);
}

/**
 * @param apiKey   GEMINI_API_KEY (없으면 꺼짐)
 * @param fetchImpl 테스트용 주입
 */
export function createAiBarista({ apiKey, menu, getKnowledge = () => ({}), model = '', apiBase = DEFAULT_API_BASE, fetchImpl = globalThis.fetch, log = () => {} } = {}) {
  const enabled = !!apiKey;
  let chosen = model || '';
  const usage = []; // { at, model, input, output, ok }
  const headers = { 'content-type': 'application/json', 'x-goog-api-key': apiKey || '' };

  async function call(url, init) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      return await fetchImpl(url, { ...init, signal: ctl.signal });
    } finally {
      clearTimeout(t);
    }
  }

  /** 이 키로 쓸 수 있는 모델 고르기 (서버 시작 때 한 번) */
  async function pickModel() {
    if (!enabled || model) return chosen;
    try {
      const res = await call(`${apiBase}/v1beta/models?pageSize=200`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const names = new Set(((await res.json()).models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => String(m.name).replace(/^models\//, '')));
      chosen = MODEL_PREFERENCE.find((m) => names.has(m)) || '';
    } catch (e) {
      log(`[AI 바리스타] 모델 목록을 못 받았습니다 (${e.message}) → 기본 모델로 시도`);
    }
    if (!chosen) chosen = 'gemini-flash-lite-latest';
    return chosen;
  }

  async function generate(body) {
    const res = await call(`${apiBase}/v1beta/models/${encodeURIComponent(chosen)}:generateContent`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  /**
   * 손님 말 → { say, items, dining, wants_help } (검증 끝난 값). 실패면 null (→ 규칙형 결과 그대로)
   * @param history [{role:'user'|'model', text}]
   */
  async function reply({ text, history = [], cart = [] }) {
    if (!enabled) return null;
    if (!chosen) await pickModel();
    const cartLine = cart.length ? `\n(지금 담긴 메뉴: ${cart.map((c) => `${c.name || c.menu_id} ${c.quantity}`).join(', ')})` : '';
    const contents = [
      ...history.slice(-MAX_TURNS).map((h) => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: maskPersonal(text) + cartLine }] },
    ];
    const generationConfig = { responseMimeType: 'application/json', responseSchema: responseSchema(menu), temperature: 0.4, maxOutputTokens: 400 };
    const thinking = thinkingConfig(chosen);
    const body = { systemInstruction: { parts: [{ text: systemPrompt(menu, getKnowledge()) }] }, contents, generationConfig: thinking ? { ...generationConfig, thinkingConfig: thinking } : generationConfig };
    const at = new Date().toISOString();
    try {
      let data;
      try {
        data = await generate(body);
      } catch (e) {
        if (e.status !== 400 || !thinking) throw e;
        data = await generate({ ...body, generationConfig }); // 모델이 생각 설정을 모르면 빼고 한 번 더
      }
      const u = data.usageMetadata || {};
      usage.push({ at, model: chosen, input: u.promptTokenCount || 0, output: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0), ok: true });
      const raw = JSON.parse(data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}');
      const { items, dropped } = validateAiItems(raw.items, menu);
      if (dropped.length) log(`[AI 바리스타] 메뉴판에 없는 메뉴를 버렸습니다: ${dropped.join(', ')}`);
      return {
        say: cleanSay(raw.say) || '죄송해요, 다시 한번 말씀해 주시겠어요?',
        items,
        dining: ['DINE_IN', 'TAKEOUT'].includes(raw.dining) ? raw.dining : null,
        wants_help: raw.wants_help === true,
      };
    } catch (e) {
      usage.push({ at, model: chosen, input: 0, output: 0, ok: false });
      log(`[AI 바리스타] 응답 실패 (${e.name === 'AbortError' ? '시간 초과' : e.message}) → 규칙형으로 계속`);
      return null;
    }
  }

  /** 오늘(UTC 아님, 서버 시각 기준 최근 24시간) 사용량 — 실제 기록으로만 */
  function stats(since = Date.now() - 86400000) {
    const recent = usage.filter((u) => Date.parse(u.at) >= since);
    return {
      enabled,
      model: chosen || null,
      calls: recent.length,
      failures: recent.filter((u) => !u.ok).length,
      input_tokens: recent.reduce((s, u) => s + u.input, 0),
      output_tokens: recent.reduce((s, u) => s + u.output, 0),
    };
  }

  return { enabled, pickModel, reply, stats, get model() { return chosen; } };
}
