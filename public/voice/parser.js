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
      if (item.temps.indexOf(temp) === -1) temp = item.temps[0]; // 없는 온도는 가능한 것으로
      return { id: item.id, name: item.name, temp: temp, qty: idx === found.length - 1 ? qty : 1 };
    });
  }

  function parseOrder(text, menu) {
    var aliases = buildAliasList(menu);
    var merged = {};
    var order = [];
    splitClauses(text).forEach(function (c) {
      parseClause(c, menu, aliases).forEach(function (it) {
        var key = it.id + '|' + it.temp;
        if (merged[key]) merged[key].qty += it.qty;
        else { merged[key] = it; order.push(it); }
      });
    });
    return { heard: text, items: order };
  }

  // 확인 단계에서 "네 / 아니요 / 직원" 같은 말 판별
  function parseIntent(text) {
    var t = (text || '').replace(/\s+/g, '');
    if (/직원|사람불러|도와|도움/.test(t)) return 'staff';
    if (/^(아니|아뇨|틀|다시|취소|잘못|안맞|안돼)/.test(t)) return 'no';
    if (/^(네|넵|예|응|그래|맞|좋|확인|주문|그렇)/.test(t)) return 'yes';
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

  var api = { parseOrder: parseOrder, parseIntent: parseIntent, describe: describe, tempWord: tempWord, labelOf: labelOf, qtyWord: qtyWord };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OrderParser = api;
})(typeof window !== 'undefined' ? window : this);
