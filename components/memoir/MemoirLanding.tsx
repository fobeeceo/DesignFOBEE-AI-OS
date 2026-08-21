import Link from "next/link";
import { CHAPTERS, PARTS, QUESTIONS, chaptersOfPart } from "@/lib/memoir/questions";
import { CHARS_PER_PAGE, CHARS_PER_QUESTION, TARGET_PAGES } from "@/lib/memoir/manuscript";

/**
 * 자서전 코너 소개.
 *
 * ⚠️ 화면의 모든 수치는 데이터에서 계산한다(§14-A ①). 질문을 추가하면 여기 숫자도 함께 바뀐다.
 * ⚠️ 후기·이용자 수·제작 실적은 싣지 않는다 — 아직 실제 자료가 없다(§14-A ②).
 */
export function MemoirLanding() {
  const minutesPerQuestion = Math.round(CHARS_PER_QUESTION / 300); // 구술 약 300자/분 기준
  const totalHours = Math.round((QUESTIONS.length * minutesPerQuestion) / 60);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-[13px] font-semibold tracking-[0.2em] text-[#A8998A]">자서전 코너</p>
      <h1 className="mt-4 text-[30px] font-bold leading-[1.35] text-[#1B1815] sm:text-[40px]">
        질문에 답하다 보면
        <br />
        한 권이 됩니다
      </h1>
      <p className="mt-5 text-[17px] leading-[1.8] text-[#5C5346]">
        무엇부터 써야 할지 몰라 못 쓰는 것이지, 쓸 이야기가 없어서 못 쓰는 사람은 없습니다.
        여기서는 순서대로 질문을 드립니다. 휴대폰으로 열어서 말로 답하시면 글이 됩니다.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/memoir/write"
          className="inline-flex h-14 items-center justify-center rounded-full bg-[#8C4A32] px-8 text-[17px] font-semibold text-white"
        >
          첫 질문부터 시작하기
        </Link>
        <Link
          href="/memoir/book"
          className="inline-flex h-14 items-center justify-center rounded-full border border-[#D5CFC3] px-8 text-[17px] font-semibold text-[#5C5346]"
        >
          쓰던 원고 이어서 보기
        </Link>
      </div>

      {/* 분량 계산 — 정직하게 숫자로 보여준다(§0-2 원칙 3). */}
      <section className="mt-14 rounded-3xl bg-[#1B1815] p-7 text-white sm:p-9">
        <h2 className="text-[20px] font-bold">300쪽이 어떻게 만들어지나</h2>
        <ul className="mt-5 space-y-3 text-[16px] leading-[1.8] text-white/85">
          <li>
            질문 <strong className="font-semibold text-white">{QUESTIONS.length}개</strong> ·{" "}
            {CHAPTERS.length}개 장 · {PARTS.length}부 구성
          </li>
          <li>
            질문 하나에 평균{" "}
            <strong className="font-semibold text-white">
              {CHARS_PER_QUESTION.toLocaleString()}자
            </strong>{" "}
            (말로 약 {minutesPerQuestion}분)
          </li>
          <li>
            모두 답하면 약{" "}
            <strong className="font-semibold text-white">
              {(QUESTIONS.length * CHARS_PER_QUESTION).toLocaleString()}자
            </strong>{" "}
            = 약 {TARGET_PAGES}쪽
          </li>
          <li>
            하루 한 질문이면 약 {Math.ceil(QUESTIONS.length / 30)}개월, 몰아서 하면 약 {totalHours}시간
          </li>
        </ul>
        <p className="mt-5 text-[14px] leading-relaxed text-white/55">
          한 쪽을 {CHARS_PER_PAGE}자로 환산한 값입니다. 실제 인쇄 쪽수는 판형·글자 크기·사진에 따라
          달라집니다. 질문을 다 채우지 않아도 책은 됩니다 — 분량은 목표이지 조건이 아닙니다.
        </p>
      </section>

      {/* 사용법 */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold text-[#1B1815]">어떻게 쓰나요</h2>
        <ol className="mt-6 space-y-6">
          {[
            {
              t: "휴대폰으로 엽니다",
              d: "따로 설치할 것도, 가입할 것도 없습니다. 이 주소를 즐겨찾기에 넣어두시면 됩니다.",
            },
            {
              t: "질문을 읽고 말합니다",
              d: "‘말로 답하기’를 누르고 편하게 말씀하시면 그대로 글자가 됩니다. 손으로 쓰셔도 됩니다.",
            },
            {
              t: "AI가 더 물어봅니다",
              d: "답이 짧으면 ‘더 물어봐 주세요’를 누르세요. 그 답에 맞는 꼬리질문을 드립니다. 없는 이야기를 지어내지는 않습니다.",
            },
            {
              t: "말한 것을 글로 다듬습니다",
              d: "말한 대로 받아쓰면 문장이 거칩니다. ‘글로 다듬기’가 문장만 정리합니다. 사실은 건드리지 않습니다.",
            },
            {
              t: "원고를 내려받습니다",
              d: "언제든 파일로 받아 인쇄소나 출판사에 넘길 수 있습니다. 원고는 이 휴대폰 안에만 저장됩니다.",
            },
          ].map((step, i) => (
            <li key={step.t} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8C4A32] text-[15px] font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-[17px] font-semibold text-[#1B1815]">{step.t}</p>
                <p className="mt-1 text-[16px] leading-[1.8] text-[#5C5346]">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 목차 */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold text-[#1B1815]">무엇을 묻나요</h2>
        <p className="mt-2 text-[16px] leading-[1.8] text-[#5C5346]">
          잘한 일만 묻지 않습니다. 무너졌던 때, 미안했던 사람, 아직 못 한 말까지 묻습니다.
          자랑만 남은 자서전은 아무도 끝까지 읽지 않기 때문입니다.
        </p>

        <div className="mt-6 space-y-6">
          {PARTS.map((part) => (
            <div key={part.id} className="rounded-2xl border border-[#E5DFD4] bg-white p-5">
              <p className="text-[13px] font-semibold tracking-widest text-[#A8998A]">{part.label}</p>
              <p className="mt-1 text-[18px] font-bold text-[#1B1815]">{part.title}</p>
              <ul className="mt-3 space-y-1.5">
                {chaptersOfPart(part.id).map((c) => (
                  <li key={c.id} className="text-[16px] leading-relaxed text-[#5C5346]">
                    · {c.title} — <span className="text-[#8C8172]">{c.subtitle}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 개인정보 */}
      <section className="mt-14 rounded-2xl bg-[#F1EDE6] p-6">
        <h2 className="text-[18px] font-bold text-[#1B1815]">원고는 어디에 저장되나요</h2>
        <ul className="mt-3 space-y-2 text-[16px] leading-[1.8] text-[#5C5346]">
          <li>· 답변은 이 휴대폰(브라우저) 안에만 저장됩니다. 서버로 보내지 않습니다.</li>
          <li>· ‘더 물어봐 주세요’와 ‘글로 다듬기’를 누를 때만 그 답변이 AI에 전달됩니다.</li>
          <li>· 브라우저 기록을 지우거나 기기를 바꾸면 원고가 사라집니다. 자주 내보내 주세요.</li>
        </ul>
      </section>

      <div className="mt-14 border-t border-[#E5DFD4] pt-8">
        <p className="text-[16px] leading-[1.8] text-[#5C5346]">
          이 도구는 (주)디자인포비 대표 이대성이 자기 자서전을 쓰면서 만들었습니다.
          같은 질문으로 같은 방식으로 쓴 기록입니다.
        </p>
        <Link
          href="/memoir/write"
          className="mt-6 inline-flex h-14 items-center justify-center rounded-full bg-[#8C4A32] px-8 text-[17px] font-semibold text-white"
        >
          첫 질문부터 시작하기
        </Link>
      </div>
    </div>
  );
}
