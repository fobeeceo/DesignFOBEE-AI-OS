/*
 * 주문 문장 인식기 (규칙 기반, 서버 없이 브라우저에서 동작)
 * 예) "아메리카노 두 잔이랑 따뜻한 라떼 한 잔" -> [{아메리카노 hot 2}, {카페라떼 hot 1}]
 * 비용이 들지 않고 빠릅니다. 이걸로 못 알아들은 문장만 AI(Claude)에게 넘깁니다.
 */
(function (root) {
  var NUM = { 하나: 1, 둘: 2, 셋: 3, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 한: 1, 두: 2, 세: 3, 네: 4 };
  var UNIT = '(?:잔|개|병|조각)';
  // 한/두/세/네 는 "네, 맞아요" 같은 말과 헷갈리므로 반드시 단위(잔/개)가 붙을 때만 수량으로 봅니다.
  var QTY_SRC =
    '(?<![가-힣])(?:(\\d+|하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열)\\s*' + UNIT + '?|(한|두|세|네)\\s*' + UNIT + ')(?:이요|요|만|씩)?(?![가-힣])';
  var HOT = /따뜻|따듯|뜨거|뜨겁|핫/i;
  var ICE = /시원|차가|차갑|아이스|얼음/i;

  // 음성 인식이 자주 다르게 적는 철자를 메뉴 표기로 맞춥니다.
  function normalize(text) {
    return String(text || '')
      .replace(/라테/g, '라떼')
      .replace(/아메리까노|아메리카느|아메리카너/g, '아메리카노')
      .replace(/카푸치노|카푸치너|까푸치노/g, '카푸치노')
      .replace(/마키아토|마끼아토|마끼아또/g, '마끼아또')
      .replace(/에스프레쏘|에스프래소/g, '에스프레소')
      .replace(/초콜렛|초콜릿/g, '초콜릿');
  }

  function qtyOf(m) {
    var w = m[1] || m[2];
    return /^\d+$/.test(w) ? Math.min(parseInt(w, 10), 20) : NUM[w];
  }

  // 문장을 "접속어"와 "수량 끝"을 기준으로 주문 한 덩어리씩 자릅니다.
  function splitClauses(text) {
    var parts = text.split(/\s*(?:,|그리고요?|이랑|하고|랑)\s*/);
    var out = [];
    parts.forEach(function (part) {
      var re = new RegExp(QTY_SRC, 'g');
      var prev = 0, m;
      while ((m = re.exec(part))) {
        var end = m.index + m[0].length;
        out.push(part.slice(prev, end));
        prev = end;
      }
      if (prev < part.length) out.push(part.slice(prev));
    });
    return out.filter(function (c) { return c.trim(); });
  }

  function buildAliasList(menu) {
    var list = [];
    menu.items.forEach(function (it) {
      it.aliases.forEach(function (a) { list.push({ alias: a, id: it.id, temp: null }); });
    });
    (menu.specialAliases || []).forEach(function (s) { list.push({ alias: s.alias, id: s.id, temp: s.temp }); });
    return list.sort(function (a, b) { return b.alias.length - a.alias.length; });
  }

  function parseClause(raw, menu, aliases) {
    var t = raw.replace(/\s+/g, '');
    var covered = new Array(t.length).fill(false);
    var found = [];
    aliases.forEach(function (a) {
      var from = 0, pos;
      while ((pos = t.indexOf(a.alias, from)) !== -1) {
        var free = true;
        for (var i = pos; i < pos + a.alias.length; i++) if (covered[i]) free = false;
        if (free) {
          for (var j = pos; j < pos + a.alias.length; j++) covered[j] = true;
          found.push({ pos: pos, id: a.id, temp: a.temp });
        }
        from = pos + a.alias.length;
      }
    });
    found.sort(function (a, b) { return a.pos - b.pos; });
    if (!found.length) return [];

    var qm = new RegExp(QTY_SRC).exec(raw);
    var qty = qm ? qtyOf(qm) : 1;
    var said = HOT.test(t) ? 'hot' : ICE.test(t) ? 'ice' : null;

    return found.map(function (f, idx) {
      var item = menu.items.filter(function (x) { return x.id === f.id; })[0];
      var temp = f.temp || said || item.defaultTemp || item.temps[0];
      var note = null;
      if (item.temps.indexOf(temp) === -1) { // 없는 온도는 가능한 것으로, 그리고 손님께 알려 드립니다
        if (temp !== 'one' && item.temps[0] !== 'one') note = item.name + '는 ' + tempWord(item.temps[0]) + ' 것만 있어요.';
        temp = item.temps[0];
      }
      return { id: item.id, name: item.name, temp: temp, qty: idx === found.length - 1 ? qty : 1, note: note };
    });
  }

  // "하나 더 주세요" / "한 잔 더" / "똑같은 걸로 하나 더" : 방금 담은 메뉴를 더 담는 말
  var REPEAT_RE = /^(?:(?:같은|똑같은|이거|그거)\s*(?:걸로|거)?\s*)?(?:(\d+|하나|둘|셋|넷|한|두|세|네)\s*(?:잔|개)?\s*)?(?:더|또|추가)(?:\s*(?:주세요|해\s*주세요|할게요|요|줘요|줘))?$/;
  function repeatQty(text) {
    var t = text.replace(/\s+/g, ' ').trim();
    var m = REPEAT_RE.exec(t);
    if (!m) return 0;
    if (!m[1]) return /더|또/.test(t) ? 1 : 0; // "추가"만 말한 건 '더 주문하겠다'는 뜻이지 같은 걸 또 담으라는 뜻이 아님
    return /^\d+$/.test(m[1]) ? Math.min(parseInt(m[1], 10), 20) : NUM[m[1]];
  }

  function parseOrder(text, menu) {
    text = normalize(text);
    var aliases = buildAliasList(menu);
    var merged = {};
    var order = [];
    var notes = [];
    splitClauses(text).forEach(function (c) {
      parseClause(c, menu, aliases).forEach(function (it) {
        var key = it.id + '|' + it.temp;
        if (it.note && notes.indexOf(it.note) === -1) notes.push(it.note);
        if (merged[key]) merged[key].qty += it.qty;
        else { merged[key] = it; order.push(it); }
      });
    });
    return { heard: text, items: order, notes: notes, repeat: order.length ? 0 : repeatQty(text) };
  }

  // 확인 단계에서 하는 말 판별: staff(직원) / more(추가) / no(처음부터) / yes(주문) / unknown
  function parseIntent(text) {
    var t = (text || '').replace(/\s+/g, '');
    if (/직원|사람불러|도와|도움/.test(t)) return 'staff';
    if (/빼|지워|삭제/.test(t)) return 'remove';
    if (/추가|더있|더할|더주문|있어요|있습니다|하나더|더요/.test(t) && !/없/.test(t)) return 'more';
    if (/^(아니|아뇨|틀|다시|취소|잘못|안맞|안돼)|처음부터|다시할/.test(t)) return 'no';
    if (/^(네|넵|예|응|그래|맞|좋|확인|주문|그렇|없어|없습|됐|괜찮|결제|그게다|이게다|다예요|다입니다)/.test(t)) return 'yes';
    return 'unknown';
  }

  var KO_QTY = ['', '한', '두', '세', '네'];
  function qtyWord(n) { return n <= 4 ? KO_QTY[n] + ' 잔' : n + '잔'; }
  // 'one' = 핫/아이스 구분이 없는 메뉴(에스프레소 등). 온도를 지어내지 않고 빈 말로 둡니다.
  function tempWord(t) { return t === 'ice' ? '시원한' : t === 'hot' ? '따뜻한' : ''; }
  function labelOf(i) { var w = tempWord(i.temp); return (w ? w + ' ' : '') + i.name; }

  // 읽어 주는 문장: "따뜻한 아메리카노 두 잔, 시원한 카페라떼 한 잔"
  function describe(items) {
    return items.map(function (i) { return labelOf(i) + ' ' + qtyWord(i.qty); }).join(', ');
  }

  var api = { normalize: normalize, parseOrder: parseOrder, parseIntent: parseIntent, describe: describe, tempWord: tempWord, labelOf: labelOf, qtyWord: qtyWord };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OrderParser = api;
})(typeof window !== 'undefined' ? window : this);
