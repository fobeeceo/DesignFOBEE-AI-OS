// 화면·음성·주문서가 함께 쓰는 표기 규칙. 브라우저와 Node 양쪽에서 import 한다.

const QTY_WORDS = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

export function won(amount) {
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

/** 음성용 수량: 1 → "한", 2 → "두" … 11 이상은 숫자 */
export function qtyWord(n) {
  return QTY_WORDS[n] || String(n);
}

export function temperatureLabel(t) {
  if (t === 'ICE') return '아이스';
  if (t === 'HOT') return '따뜻한';
  return '';
}

/** "아이스 아메리카노" / "따뜻한 카페라떼" / "팥빙수" */
export function itemLabel(name, temperature) {
  const t = temperatureLabel(temperature);
  return t ? `${t} ${name}` : name;
}

function hasBatchim(word) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

/** 받침에 맞는 조사: josa('팥빙수', '을', '를') → '팥빙수를' */
export function josa(word, withBatchim, withoutBatchim) {
  return word + (hasBatchim(word) ? withBatchim : withoutBatchim);
}

/** "아이스 아메리카노 한 잔, 카페라떼 두 잔" */
export function speakItems(lines) {
  return lines.map((l) => `${l.display_name} ${qtyWord(l.quantity)} ${l.unit}`).join(', ');
}
