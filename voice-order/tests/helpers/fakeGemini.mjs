// 테스트용 가짜 Gemini 서버 — 실제 Gemini API와 같은 모양(models 목록, generateContent)으로 정해진 대답을 돌려준다.
// 단독 실행: node tests/helpers/fakeGemini.mjs 3999   (E2E에서 GEMINI_API_BASE=http://127.0.0.1:3999)
import http from 'node:http';

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

/** 손님 말 → 가짜 AI 대답 (테스트 시나리오) */
function answer(text) {
  if (/노란/.test(text)) return { say: '유자차 말씀이시죠? 따뜻하게 담았어요.', items: [{ menu_id: 'YUZU_TEA', temperature: 'HOT', quantity: 1 }], dining: null, wants_help: false };
  if (/속이 안 좋/.test(text)) return { say: '따뜻한 캐모마일이나 생강차는 어떠세요? 한 잔에 6,000원이에요.', items: [], dining: null, wants_help: false };
  if (/없는 메뉴 시험/.test(text)) return { say: '아인슈페너 담았어요.', items: [{ menu_id: 'EINSPANNER', temperature: 'HOT', quantity: 1 }], dining: null, wants_help: false };
  if (/사람 불러/.test(text)) return { say: '네, 직원을 불러 드릴게요.', items: [], dining: null, wants_help: true };
  return { say: '천천히 다시 말씀해 주시겠어요?', items: [], dining: null, wants_help: false };
}

export function startFakeGemini(port = 0, { fail = false } = {}) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const key = req.headers['x-goog-api-key'];
      if (!key) return json(res, 403, { error: { message: 'API key missing' } });
      if (req.method === 'GET' && req.url.startsWith('/v1beta/models')) {
        return json(res, 200, { models: [{ name: 'models/gemini-3.1-flash-lite', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-flash-latest', supportedGenerationMethods: ['generateContent'] }] });
      }
      const m = req.url.match(/^\/v1beta\/models\/([^:]+):generateContent$/);
      if (req.method === 'POST' && m) {
        const body = JSON.parse(raw || '{}');
        calls.push({ model: decodeURIComponent(m[1]), body, key });
        if (fail || server.fail) return json(res, 500, { error: { message: 'boom' } });
        const last = body.contents?.at(-1)?.parts?.[0]?.text || '';
        return json(res, 200, {
          candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(answer(last)) }] } }],
          usageMetadata: { promptTokenCount: 3000, candidatesTokenCount: 60, thoughtsTokenCount: 0 },
        });
      }
      json(res, 404, { error: { message: 'not found' } });
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, calls, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) })));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const g = await startFakeGemini(Number(process.argv[2] || 3999));
  console.log(`가짜 Gemini: ${g.base}`);
}
