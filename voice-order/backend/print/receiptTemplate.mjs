// 주문서(영수증 폭 80mm 기준) HTML. 화면 인쇄와 향후 프린터 변환이 같은 내용을 쓰도록 한 곳에 둔다.
import { won } from '../../core/format.mjs';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function formatKst(iso) {
  const d = new Date(iso);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

export function renderReceipt(order) {
  const lines = order.items
    .map((l) => `<tr><td>${esc(l.display_name)}</td><td class="qty">${l.quantity}</td><td class="amt">${won(l.line_total)}</td></tr>`)
    .join('');
  return `<div class="receipt">
  <div class="r-center r-brand">GBRICK COFFEE</div>
  <div class="r-center">AI VOICE ORDER</div>
  <div class="r-rule double"></div>
  <div class="r-big">주문번호: ${esc(order.order_id)}</div>
  <div>시간: ${formatKst(order.confirmed_at || order.created_at)}</div>
  <div class="r-rule"></div>
  <table>${lines}</table>
  <div class="r-rule"></div>
  <div class="r-big">합계: ${won(order.total_amount)}</div>
  <div class="r-big">결제: 카운터</div>
  <div class="r-rule double"></div>
  <div class="r-center r-small">DEMO · 결제 전 주문서입니다</div>
</div>`;
}
