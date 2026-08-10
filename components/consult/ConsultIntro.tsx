import { CONSULT_CREDIBILITY, CONSULT_DELIVERABLES, CONSULT_STEPS } from "@/lib/consult/content";

/**
 * /consult 상단 — 도면에서 3D 시안으로 이어지는 흐름을 먼저 보여준다.
 *
 * ⚠️ Reveal을 쓰지 않고 opacity:0으로 시작하지 않는다(대표 지시).
 *    JS가 실패해도 내용이 보여야 한다 — iOS Safari 이미지 미표시 사고(84e965d)의 재발 방지.
 * ⚠️ 본문 15px 이상. 도면을 들고 오시는 분들 상당수가 40~60대다.
 */
export function ConsultIntro() {
  return (
    <>
      <section className="pt-10 sm:pt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          DesignFOBEE · 공간 상담
        </p>
        <h1 className="mt-3 text-[31px] font-bold leading-[1.35] tracking-tight text-foreground sm:text-4xl">
          도면 한 장이면
          <br />
          공간을 먼저 보실 수 있습니다
        </h1>

        {/* 2D 도면 → 3D 시안. 장식이 아니라 이 서비스가 무엇인지 한 눈에 말하는 그림이다. */}
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3.5">
          <figure className="relative flex aspect-[4/3] items-center justify-center border border-border bg-white">
            <svg viewBox="0 0 120 90" fill="none" stroke="#2E4057" strokeWidth="1.6" className="h-[78%] w-[78%]">
              <rect x="8" y="8" width="104" height="74" />
              <line x1="8" y1="46" x2="62" y2="46" />
              <line x1="62" y1="8" x2="62" y2="82" />
              <path d="M30 46 a10 10 0 0 1 10 -10" strokeWidth="1" opacity=".6" />
              <line x1="86" y1="8" x2="86" y2="20" strokeWidth="3" />
              <line x1="8" y1="60" x2="20" y2="60" strokeWidth="3" />
            </svg>
            <figcaption className="absolute bottom-2 left-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
              2D 도면
            </figcaption>
          </figure>

          <span aria-hidden className="font-mono text-[17px] text-accent">
            →
          </span>

          <figure className="relative flex aspect-[4/3] items-center justify-center border border-border bg-muted">
            <svg viewBox="0 0 120 90" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" className="h-[78%] w-[78%]">
              <path d="M12 70 L12 30 L60 12 L108 30 L108 70 Z" fill="#fff" fillOpacity=".55" />
              <path d="M12 30 L60 48 L108 30" />
              <path d="M60 48 L60 88" opacity=".45" />
              <rect x="24" y="52" width="20" height="14" opacity=".7" />
              <rect x="76" y="52" width="20" height="14" opacity=".7" />
              <circle cx="60" cy="26" r="3" opacity=".8" />
            </svg>
            <figcaption className="absolute bottom-2 left-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
              3D 시안
            </figcaption>
          </figure>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
          손으로 그린 스케치도 괜찮습니다. 도면을 보내주시면 실제 마감재와 조명을 반영한 3D 시안을
          만들어 보내드립니다. 계약 전에 공간을 먼저 확인하실 수 있습니다.
        </p>
      </section>

      <hr className="my-10 border-border" />

      <section>
        <h2 className="text-xl font-bold text-foreground">보내드리는 것</h2>
        <ul className="mt-5">
          {CONSULT_DELIVERABLES.map((item, i) => (
            <li
              key={item.no}
              className={`relative border-b border-border py-4 pl-10 ${i === 0 ? "border-t" : ""}`}
            >
              <span className="absolute left-0 top-[18px] font-mono text-[11px] tracking-wider text-accent">
                {item.no}
              </span>
              <b className="block text-[15px] font-medium text-foreground">{item.title}</b>
              <span className="text-sm text-muted-foreground">{item.desc}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-l-2 border-accent bg-muted px-5 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{CONSULT_CREDIBILITY}</p>
        </div>
      </section>

      <hr className="my-10 border-border" />

      <section>
        <h2 className="text-xl font-bold text-foreground">진행 절차</h2>
        <ol className="mt-5 border-l border-border pl-6">
          {CONSULT_STEPS.map((s, i) => (
            <li key={s.when} className={`relative ${i === CONSULT_STEPS.length - 1 ? "" : "pb-6"}`}>
              <span
                aria-hidden
                className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-accent"
              />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {s.when}
              </span>
              <h3 className="mb-1 mt-1 text-[17px] font-bold text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
