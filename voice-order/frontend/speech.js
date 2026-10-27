// 음성 입력(STT)·음성 안내(TTS) 추상화.
// SpeechProvider = { name, isSupported(), listen() → Promise<string>, cancel() }
// 실패 시 SpeechFailure(code) — code: 'no-speech' | 'not-allowed' | 'network' | 'aborted' | 'unsupported' | 'error'
// 지금은 BrowserSpeechProvider(Web Speech API)만 있다. 서버 STT(OpenAI·Google 등)를 붙일 때는
// 같은 모양의 provider를 만들고, API 키는 서버에만 두고 브라우저는 녹음 파일만 서버로 보낸다.

export class SpeechFailure extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/**
 * 이어 듣기에서 받은 조각들을 한 문장으로. 일부 안드로이드 크롬은 조각마다 앞 내용을 다시 붙여 보내므로
 * ("아이스", "아이스 아메리카노") 앞 내용으로 시작하는 조각은 덧붙이지 않고 바꾼다.
 */
export function joinSegments(segments) {
  let out = '';
  for (const raw of segments) {
    const seg = String(raw || '').trim();
    if (!seg) continue;
    if (!out || seg.startsWith(out)) out = seg;
    else if (!out.endsWith(seg)) out = `${out} ${seg}`;
  }
  return out;
}

export class BrowserSpeechProvider {
  /**
   * @param continuous 이어 듣기: 어르신이 말 중간에 잠깐 쉬어도 끊지 않고, silenceMs 동안 조용하면 끝낸다 (?stt=classic 이면 예전 방식)
   */
  constructor({ lang = 'ko-KR', timeoutMs = 15000, continuous = true, silenceMs = 1600, noSpeechMs = 8000 } = {}) {
    this.name = 'browser';
    this.lang = lang;
    this.timeoutMs = timeoutMs;
    this.continuous = continuous;
    this.silenceMs = silenceMs;
    this.noSpeechMs = noSpeechMs;
    this.rec = null;
  }

  static ctor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  isSupported() {
    return !!BrowserSpeechProvider.ctor();
  }

  /** @param onInterim 말하는 도중의 글자를 화면에 보여줄 콜백 */
  listen(onInterim = () => {}) {
    const Ctor = BrowserSpeechProvider.ctor();
    if (!Ctor) return Promise.reject(new SpeechFailure('unsupported'));
    this.cancel();
    return new Promise((resolve, reject) => {
      const rec = new Ctor();
      this.rec = rec;
      rec.lang = this.lang;
      rec.interimResults = true;
      rec.continuous = this.continuous;
      rec.maxAlternatives = 1;
      let finalText = '';
      let latest = '';
      let settled = false;
      const stop = () => {
        try { rec.stop(); } catch { /* 이미 멈춤 */ }
      };
      // 이어 듣기: 아무 말이 없으면 noSpeechMs 뒤, 말하다 멈추면 silenceMs 뒤에 끝낸다
      let quiet = this.continuous ? setTimeout(stop, this.noSpeechMs) : null;
      const done = (fn, v) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(quiet);
        if (this.rec === rec) this.rec = null; // 늦게 끝난 이전 듣기가 새 듣기를 지우지 않게
        fn(v);
      };
      const timer = setTimeout(stop, this.timeoutMs);

      rec.onresult = (e) => {
        if (this.continuous) {
          // 처음부터 다시 모은다 (조각이 다시 오거나 고쳐져도 겹치지 않게)
          const all = Array.from(e.results, (r) => r[0].transcript);
          latest = joinSegments(all);
          finalText = joinSegments(Array.from(e.results).filter((r) => r.isFinal).map((r) => r[0].transcript));
          clearTimeout(quiet);
          quiet = setTimeout(stop, this.silenceMs);
        } else {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t;
            else interim += t;
          }
          latest = (finalText + interim).trim();
        }
        onInterim(latest);
      };
      rec.onerror = (e) => {
        const code = ['no-speech', 'not-allowed', 'service-not-allowed', 'network', 'aborted', 'audio-capture'].includes(e.error)
          ? (e.error === 'service-not-allowed' ? 'not-allowed' : e.error)
          : 'error';
        done(reject, new SpeechFailure(code));
      };
      rec.onend = () => {
        // 이어 듣기는 멈추는 순간의 말(아직 확정 전 조각 포함)까지 쓴다
        const text = (this.continuous ? latest || finalText : finalText || latest).trim();
        if (text) done(resolve, text);
        else done(reject, new SpeechFailure('no-speech'));
      };
      try {
        rec.start();
      } catch {
        done(reject, new SpeechFailure('error'));
      }
    });
  }

  cancel() {
    if (this.rec) {
      try { this.rec.abort(); } catch { /* 무시 */ }
      this.rec = null;
    }
  }
}

export function createSpeechProvider() {
  const classic = typeof location !== 'undefined' && new URLSearchParams(location.search).get('stt') === 'classic';
  return new BrowserSpeechProvider({ continuous: !classic, timeoutMs: classic ? 10000 : 15000 });
}

/** 한국어 목소리 고르기: 고음질(Premium·Enhanced·Neural·Natural) → Google → 유나·Siri → 아무 한국어 */
export function pickKoreanVoice(voices) {
  const ko = (voices || []).filter((v) => /^ko/i.test(v.lang || ''));
  const rank = (v) => {
    const n = v.name || '';
    if (/premium|enhanced|neural|natural|고품질/i.test(n)) return 0;
    if (/google/i.test(n)) return 1;
    if (/yuna|유나|siri|sunhi|heami/i.test(n)) return 2;
    return v.lang === 'ko-KR' ? 3 : 4;
  };
  return ko.sort((a, b) => rank(a) - rank(b))[0] || null;
}

/** 음성 안내 (TTS). 지원하지 않거나 소리가 꺼져 있으면 조용히 넘어간다 — 화면 글자가 항상 함께 나온다. */
export class Speaker {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voice = null;
    if (this.synth) {
      const pick = () => {
        this.voice = pickKoreanVoice(this.synth.getVoices());
      };
      pick();
      this.synth.onvoiceschanged = pick;
    }
  }

  /** iOS는 첫 음성을 버튼 터치 안에서 내야 이후 음성이 나온다. 첫 터치 때 호출. */
  unlock() {
    if (!this.synth || this.unlocked) return;
    this.unlocked = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    this.synth.speak(u);
  }

  speak(text) {
    if (!this.synth || !text) return Promise.resolve();
    this.synth.cancel();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      if (this.voice) u.voice = this.voice;
      u.rate = 0.95;
      // 일부 브라우저는 onend가 오지 않는다 → 글자 수 기준 최대 대기
      const fallback = setTimeout(resolve, 1500 + text.length * 120);
      u.onend = u.onerror = () => {
        clearTimeout(fallback);
        resolve();
      };
      this.synth.speak(u);
    });
  }

  cancel() {
    this.synth?.cancel();
  }
}
