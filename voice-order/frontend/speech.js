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

export class BrowserSpeechProvider {
  constructor({ lang = 'ko-KR', timeoutMs = 10000 } = {}) {
    this.name = 'browser';
    this.lang = lang;
    this.timeoutMs = timeoutMs;
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
      rec.continuous = false;
      rec.maxAlternatives = 1;
      let finalText = '';
      let latest = '';
      let settled = false;
      const done = (fn, v) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this.rec === rec) this.rec = null; // 늦게 끝난 이전 듣기가 새 듣기를 지우지 않게
        fn(v);
      };
      const timer = setTimeout(() => {
        try { rec.stop(); } catch { /* 이미 멈춤 */ }
      }, this.timeoutMs);

      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        latest = (finalText + interim).trim();
        onInterim(latest);
      };
      rec.onerror = (e) => {
        const code = ['no-speech', 'not-allowed', 'service-not-allowed', 'network', 'aborted', 'audio-capture'].includes(e.error)
          ? (e.error === 'service-not-allowed' ? 'not-allowed' : e.error)
          : 'error';
        done(reject, new SpeechFailure(code));
      };
      rec.onend = () => {
        const text = (finalText || latest).trim();
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
  return new BrowserSpeechProvider();
}

/** 음성 안내 (TTS). 지원하지 않거나 소리가 꺼져 있으면 조용히 넘어간다 — 화면 글자가 항상 함께 나온다. */
export class Speaker {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voice = null;
    if (this.synth) {
      const pick = () => {
        const voices = this.synth.getVoices();
        this.voice = voices.find((v) => v.lang === 'ko-KR') || voices.find((v) => v.lang?.startsWith('ko')) || null;
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
