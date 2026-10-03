// 주문서 출력 인터페이스.
// PrintProvider = { name, print(order) → Promise<{ mode, html? }> }
// MVP는 BrowserPrintProvider(브라우저 인쇄 창). 열전사 프린터는 같은 모양의 provider를 추가하면 된다.
import { renderReceipt } from './receiptTemplate.mjs';

export class PrintError extends Error {}

export function createBrowserPrintProvider() {
  return {
    name: 'browser',
    async print(order) {
      // 서버는 주문서 HTML만 만든다. 실제 인쇄는 브라우저의 window.print()가 한다.
      return { mode: 'browser', html: renderReceipt(order) };
    },
  };
}

/** 향후 ESC/POS 열전사 프린터 자리. 아직 연결하지 않았으므로 항상 실패를 알린다. */
export function createThermalPrintProvider() {
  return {
    name: 'thermal',
    async print() {
      throw new PrintError('열전사 프린터가 아직 연결되지 않았습니다.');
    },
  };
}

export function createPrintProvider(name = process.env.VOICE_ORDER_PRINTER || 'browser') {
  if (name === 'thermal') return createThermalPrintProvider();
  return createBrowserPrintProvider();
}
