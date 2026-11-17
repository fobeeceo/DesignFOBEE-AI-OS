// 영수증 프린터(ESC/POS) 시리얼 직접 출력 — Web Serial API (PC 크롬·엣지)
// 윈도우 프린터 드라이버 없이 COM 포트로 바로 보낸다.

const BAUD_RATE = 9600;

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  forget?: () => Promise<void>;
  writable: WritableStream<Uint8Array> | null;
}
interface SerialLike {
  getPorts(): Promise<SerialPortLike[]>;
  requestPort(): Promise<SerialPortLike>;
}

export interface TicketItem {
  menuName: string;
  quantity: number;
  options?: { optionName: string }[];
}
export interface TicketOrder {
  orderNumber: string;
  pickupName?: string | null;
  note?: string | null;
  finalAmount: number;
  createdAt: string;
  items?: TicketItem[];
}

function getSerial(): SerialLike | null {
  if (typeof navigator === "undefined" || !("serial" in navigator)) return null;
  return (navigator as unknown as { serial: SerialLike }).serial;
}

export function isSerialSupported(): boolean {
  return getSerial() !== null;
}

let port: SerialPortLike | null = null;

export function hasPrinter(): boolean {
  return port !== null;
}

/** 이전에 허용해 둔 포트가 있으면 다시 잡는다 */
export async function loadSavedPrinter(): Promise<boolean> {
  const serial = getSerial();
  if (!serial) return false;
  const ports = await serial.getPorts();
  port = ports[0] ?? null;
  return port !== null;
}

/** 포트 선택 창을 띄운다 — 반드시 버튼 클릭 안에서 호출 */
export async function connectPrinter(): Promise<boolean> {
  const serial = getSerial();
  if (!serial) return false;
  const chosen = await serial.requestPort();
  // 예전에 고른 다른 포트가 남아 있으면 지워서 항상 방금 고른 포트만 쓰게 한다
  for (const old of await serial.getPorts()) {
    if (old !== chosen) await old.forget?.().catch(() => {});
  }
  port = chosen;
  return true;
}

// ─── 한글 인코딩 (KS X 1001 완성형) ─────────────────────────────
let eucKr: Map<string, number> | null = null;
function eucKrTable(): Map<string, number> {
  if (eucKr) return eucKr;
  const decoder = new TextDecoder("euc-kr");
  const table = new Map<string, number>();
  const pair = new Uint8Array(2);
  for (let hi = 0xa1; hi <= 0xfe; hi++) {
    for (let lo = 0xa1; lo <= 0xfe; lo++) {
      pair[0] = hi; pair[1] = lo;
      const ch = decoder.decode(pair);
      if (ch.length === 1 && ch !== "�") table.set(ch, (hi << 8) | lo);
    }
  }
  eucKr = table;
  return table;
}

function encodeText(text: string, out: number[]) {
  const table = eucKrTable();
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    // 제어문자(ESC·GS 등)는 프린터 명령으로 해석되므로 글자로 찍지 않고 공백으로 바꾼다
    if (code < 0x20 || code === 0x7f) { out.push(0x20); continue; }
    if (code < 0x80) { out.push(code); continue; }
    const pair = table.get(ch);
    if (pair === undefined) out.push(0x3f); // 프린터에 없는 글자는 ?
    else out.push(pair >> 8, pair & 0xff);
  }
}

// ─── ESC/POS ─────────────────────────────────────────────────
const ESC = 0x1b, GS = 0x1d, FS = 0x1c, LF = 0x0a;
const SIZE_NORMAL = 0x00, SIZE_TALL = 0x01, SIZE_BIG = 0x11;
const RULE = "--------------------------------";

class Ticket {
  private bytes: number[] = [ESC, 0x40, FS, 0x26]; // 초기화 + 한글 모드
  align(n: 0 | 1 | 2) { this.bytes.push(ESC, 0x61, n); return this; }
  bold(on: boolean) { this.bytes.push(ESC, 0x45, on ? 1 : 0); return this; }
  size(n: number) { this.bytes.push(GS, 0x21, n); return this; }
  line(text = "") { encodeText(text, this.bytes); this.bytes.push(LF); return this; }
  cut() { this.bytes.push(LF, LF, LF, GS, 0x56, 0x42, 0x00); return new Uint8Array(this.bytes); }
}

export function buildKitchenTicket(order: TicketOrder, storeName: string): Uint8Array {
  const ordered = new Date(order.createdAt);
  const when = `${ordered.getMonth() + 1}/${ordered.getDate()} `
    + ordered.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const items = order.items ?? [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const t = new Ticket();
  t.align(1).bold(true).line("GBRICK COFFEE").bold(false).line(storeName).line(RULE);
  t.align(0).bold(true).size(SIZE_BIG).line(`#${order.orderNumber.slice(-6).toUpperCase()}`);
  if (order.pickupName) t.line(order.pickupName);
  t.size(SIZE_NORMAL).bold(false).line(`주문 ${when}`).line(RULE);
  for (const item of items) {
    t.bold(true).size(SIZE_TALL).line(`${item.menuName} x${item.quantity}`).size(SIZE_NORMAL).bold(false);
    for (const opt of item.options ?? []) t.line(`   + ${opt.optionName}`);
  }
  t.line(RULE);
  if (order.note) t.bold(true).line(`메모: ${order.note}`).bold(false).line(RULE);
  t.line(`수량 ${totalQty}개`).align(2).line(`합계 ${order.finalAmount.toLocaleString("ko-KR")}원`);
  t.bold(true).line("현장 결제 (카운터에서 받기)").bold(false);
  return t.cut();
}

export function buildTestTicket(storeName: string): Uint8Array {
  return new Ticket()
    .align(1).bold(true).line("GBRICK COFFEE").bold(false).line(storeName).line(RULE)
    .size(SIZE_BIG).line("테스트 출력").size(SIZE_NORMAL)
    .line("한글이 깨지지 않으면 정상입니다").line("ABC abc 1234567890").line(RULE)
    .cut();
}

// ─── 전송 ────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function send(bytes: Uint8Array): Promise<void> {
  if (!port) throw new Error("프린터가 연결되지 않았습니다");
  // 같은 COM 포트를 다른 주문 프로그램도 쓰므로, 찍을 때만 열고 바로 닫는다.
  // 다른 프로그램이 출력 중이면 열기에 실패하므로 잠시 뒤 다시 시도한다.
  for (let attempt = 1; ; attempt++) {
    try { await port.open({ baudRate: BAUD_RATE }); break; }
    catch (err) {
      if (attempt >= 5) throw err;
      await sleep(800);
    }
  }
  try {
    const writer = port.writable!.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    // 9600bps는 1초에 약 960바이트 — 다 나갈 때까지 기다린 뒤 닫는다
    await sleep(Math.ceil((bytes.length * 1000) / (BAUD_RATE / 10)) + 300);
  } finally {
    await port.close().catch(() => {});
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** 출력 요청을 한 줄로 세워 순서대로 보낸다 */
export function printBytes(bytes: Uint8Array): Promise<void> {
  const job = queue.then(() => send(bytes));
  queue = job.catch(() => {});
  return job;
}
