import { won } from '/core/format.mjs';

const INPUT = { VOICE: '음성', TEXT: '텍스트', NONE: '-' };
const STATUS = { CONFIRMED: '완료', FAILED: '실패', CANCELLED: '취소', IN_PROGRESS: '진행 중' };
const PRINT = { NOT_PRINTED: '-', SENT_TO_BROWSER: '인쇄 창', PRINTED: '출력', PRINT_FAILED: '실패' };

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function time(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function reprint(orderId) {
  const r = await fetch(`/api/orders/${orderId}/print`, { method: 'POST' }).then((x) => x.json());
  if (!r.ok) return alert(`출력 실패: ${r.error}`);
  document.getElementById('print-area').innerHTML = r.html;
  window.print();
  await fetch(`/api/orders/${orderId}/print-result`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }),
  });
  load();
}

async function load() {
  const key = new URLSearchParams(location.search).get('key'); // 인터넷 공유 때만 필요
  const s = await fetch(`/api/stats${key ? `?key=${encodeURIComponent(key)}` : ''}`).then((r) => r.json());
  document.getElementById('date').textContent = `(${s.date.slice(0, 4)}-${s.date.slice(4, 6)}-${s.date.slice(6)})`;
  const kpis = [
    ['오늘 테스트 주문', s.test_sessions],
    ['완료 주문', s.completed],
    ['음성 주문', s.voice],
    ['텍스트 주문', s.text],
    ['직원 도움 요청', s.help_requests],
    ['주문 실패', s.failed],
    ['평균 처리 시간', s.avg_seconds === null ? '-' : `${s.avg_seconds}초`],
  ];
  document.getElementById('kpis').replaceChildren(
    ...kpis.map(([k, v]) => {
      const d = el('div', undefined, 'kpi');
      d.append(el('div', k, 'k'), el('div', String(v), 'v'));
      return d;
    }),
  );
  const ua = s.unanswered || [];
  document.getElementById('unanswered').replaceChildren(
    ...(ua.length
      ? ua.map((q) => {
          const tr = document.createElement('tr');
          tr.append(
            el('td', `“${q.text}”`, 'items'),
            el('td', String(q.count)),
            el('td', q.topic ? `${q.label} (${q.topic})` : q.label),
            el('td', new Date(q.last_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
          );
          return tr;
        })
      : [(() => { const tr = document.createElement('tr'); const td = el('td', '아직 없습니다.'); td.colSpan = 4; tr.append(td); return tr; })()]),
  );
  document.getElementById('rows').replaceChildren(
    ...s.recent.map((r) => {
      const tr = document.createElement('tr');
      const items = r.items.length
        ? r.items.map((l) => `${l.display_name} ${l.quantity}`).join(', ')
        : r.raw_transcript ? `“${r.raw_transcript}”` : '-';
      const status = el('td');
      status.append(el('span', STATUS[r.status] || r.status, `badge ${r.status}`));
      const action = el('td');
      if (r.order_id) {
        const b = el('button', '재출력', 'mini');
        b.onclick = () => reprint(r.order_id);
        action.append(b);
      }
      tr.append(
        el('td', r.order_id || '-'),
        el('td', time(r.created_at)),
        el('td', INPUT[r.input_type] || r.input_type),
        el('td', items, 'items'),
        el('td', r.total_amount ? won(r.total_amount) : '-'),
        status,
        el('td', r.help_requested ? '요청' : '-'),
        el('td', PRINT[r.print_status] || r.print_status),
        action,
      );
      return tr;
    }),
  );
}

load();
setInterval(load, 5000);
