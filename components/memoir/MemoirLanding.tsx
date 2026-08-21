import Link from "next/link";
import { CHAPTERS, PARTS, QUESTIONS, chaptersOfPart } from "@/lib/memoir/questions";
import { CHARS_PER_PAGE, CHARS_PER_QUESTION, TARGET_PAGES } from "@/lib/memoir/manuscript";

/**
 * 자서전 코너 소개.
 *
 * ⚠️ 화면의 모든 수치는 데이터에서 계산한다(§14-A ①). 질문을 추가하면 여기 숫자도 함께 바뀐다.
 * ⚠️ 후기·이용자 수·제작 실적은 싣지 않는다 — 아직 실제 자료가 없다(§14-A ②).
 * ⚠️ 없는 기능을 적지 않는다. 지금 내보내기는 원고 파일(.md)과 백업 파일(.json)뿐이다.
 *    Word·PDF를 쓰면 광고가 거짓이 된다.
 */
export function MemoirLanding() {
  const totalChars = QUESTIONS.length * CHARS_PER_QUESTION;
  // 하루 한 질문이면 질문 수만큼의 날이 걸린다. 156일 ≈ 5.2개월이므로 반올림해 5개월.
  const months = Math.round(QUESTIONS.length / 30);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-[13px] font-semibold tracking-[0.2em] text-[#A8998A]">자서전 코너</p>
      <h1 className="mt-4 text-[30px] font-bold leading-[1.35] text-[#1B1815] sm:text-[40px]">
        질문에 답하다 보면
        <br />
        한 권이 됩니다
      </h1>
      <p className="mt-5 text-[17px] leading-[1.8] text-[#5C5346]">
        무엇부터 써야 할지 몰라 못 쓰는 것이지, 당신에게 이야기가 없어서 못 쓰는 것은 아닙니다.
      </p>
      <p className="mt-3 text-[17px] leading-[1.8] text-[#5C5346]">
        질문은 저희가 드리겠습니다. 기억나는 대로 이야기해 주세요.
        휴대폰으로 열어서 말로 답하시면 글이 됩니다.
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

      {/* 분량 — 단정하지 않는다. 쪽수는 판형·편집에 따라 달라진다(§0-2 원칙 3). */}
      <section className="mt-14 rounded-3xl bg-[#1B1815] p-7 text-white sm:p-9">
        <h2 className="text-[20px] font-bold">{TARGET_PAGES}쪽이 어떻게 만들어지나요</h2>

        <p className="mt-5 text-[16px] leading-[1.85] text-white/85">
          질문 <strong className="font-semibold text-white">{QUESTIONS.length}개</strong> ·{" "}
          {CHAPTERS.length}개 장 · {PARTS.length}부 구성.
        </p>
        <p className="mt-3 text-[16px] leading-[1.85] text-white/85">
          질문 하나에 평균 {CHARS_PER_QUESTION.toLocaleString()}자씩 답하면 약{" "}
          <strong className="font-semibold text-white">
            {Math.round(totalChars / 10000)}만 자
          </strong>
          의 원고가 쌓입니다. 사진과 편집을 더하면 한 권의 자서전으로 완성할 수 있는 분량입니다.
        </p>
        <p className="mt-3 text-[16px] leading-[1.85] text-white/85">
          하루 한 질문씩 천천히 하시면 약 {months}개월, 시간을 내어 몰아서 답하셔도 됩니다.
        </p>

        <p className="mt-6 border-t border-white/15 pt-5 text-[14px] leading-relaxed text-white/55">
          실제 페이지 수는 판형·글자 크기·행간·여백·사진에 따라 달라집니다. 위 쪽수는 한 쪽을{" "}
          {CHARS_PER_PAGE}자로 잡은 환산값입니다. 질문을 다 채우지 않아도 책은 됩니다 — 분량은
          목표이지 조건이 아닙니다.
        </p>
      </section>

      {/* 사용법 */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold text-[#1B1815]">어떻게 쓰나요</h2>
        <ol className="mt-6 space-y-6">
          {[
            {
              t: "휴대폰으로 엽니다",
              d: ["따로 설치할 것도, 가입할 것도 없습니다. 이 주소를 즐겨찾기에 넣어두시면 됩니다."],
            },
            {
              t: "질문을 읽고 말합니다",
              d: [
                "‘말로 답하기’를 누르고 편하게 말씀하시면 그대로 글자가 됩니다. 손으로 쓰셔도 됩니다.",
                "지명이나 사람 이름은 틀리게 적힐 수 있으니, 다 말씀하신 뒤 눈으로 한 번 고쳐 주세요.",
              ],
            },
            {
              t: "AI가 더 물어봅니다",
              d: [
                "답이 짧으면 ‘더 물어봐 주세요’를 누르세요. 그 답에 맞는 꼬리질문을 드립니다.",
                "답변에 없는 사실을 새로 만들지 않도록 설계했습니다.",
              ],
            },
            {
              t: "말한 것을 글로 다듬습니다",
              d: [
                "말한 내용의 의미와 사실은 유지하면서 읽기 좋은 문장으로만 다듬습니다. 말하지 않은 사실이나 사건을 임의로 추가하지 않습니다.",
                "‘내 말투 그대로 · 자연스럽게 · 출판용 문체’ 중에서 고르실 수 있습니다.",
                "완성된 글은 반드시 본인이 읽고 사실을 확인해 주세요.",
              ],
            },
            {
              t: "원고를 내려받습니다",
              d: [
                "쌓인 원고를 언제든 파일로 저장할 수 있습니다. 직접 고치거나 가족과 나누고, 출판·인쇄를 위한 다음 작업으로 이어갈 수 있습니다.",
              ],
            },
          ].map((step, i) => (
            <li key={step.t} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8C4A32] text-[15px] font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-[17px] font-semibold text-[#1B1815]">{step.t}</p>
                {step.d.map((line) => (
                  <p key={line} className="mt-1 text-[16px] leading-[1.8] text-[#5C5346]">
                    {line}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 목차 */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold text-[#1B1815]">
          당신의 이야기를 찾는 {PARTS.length}개의 장
        </h2>
        <p className="mt-3 text-[16px] leading-[1.8] text-[#5C5346]">
          잘한 일만 묻지 않습니다. 무너졌던 때, 미안했던 사람, 아직 하지 못한 말까지 묻습니다.
          사람의 삶은 성공만으로 이루어지지 않기 때문입니다.
        </p>

        <ol className="mt-6 space-y-3">
          {PARTS.map((part, i) => (
            <li key={part.id} className="rounded-2xl border border-[#E5DFD4] bg-white p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-[14px] font-semibold tabular-nums text-[#A8998A]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[18px] font-bold text-[#1B1815]">{part.title}</p>
              </div>
              <p className="mt-2 pl-[2.1rem] text-[15px] leading-relaxed text-[#6B6255]">
                {chaptersOfPart(part.id)
                  .map((c) => c.title)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 저장 — 사실 그대로 적는다. 두루뭉술하게 안심시키지 않는다(§0-2 원칙 2). */}
      <section className="mt-14 rounded-2xl bg-[#F1EDE6] p-6">
        <h2 className="text-[18px] font-bold text-[#1B1815]">내 이야기는 어디에 저장되나요</h2>
        <p className="mt-3 text-[16px] leading-[1.8] text-[#5C5346]">
          이 서비스는 원고를 <strong className="font-semibold text-[#1B1815]">지금 쓰고 계신
          기기의 브라우저 안</strong>에 저장합니다. 서버에는 원고를 저장하지 않습니다.
        </p>
        <ul className="mt-3 space-y-2 text-[16px] leading-[1.8] text-[#5C5346]">
          <li>· ‘더 물어봐 주세요’와 ‘글로 다듬기’를 누를 때만 그 답변 하나가 AI에 전달됩니다. 전달된 내용은 저장하지 않습니다.</li>
          <li>· 다른 기기에서 이어 쓰시려면 먼저 원고를 파일로 내려받아 옮기셔야 합니다.</li>
          <li>· 브라우저 기록을 지우거나 기기를 바꾸면 원고가 사라집니다. 자주 내보내 보관해 주세요.</li>
        </ul>
      </section>

      <div className="mt-14 border-t border-[#E5DFD4] pt-8">
        <p className="text-[18px] font-semibold leading-[1.7] text-[#1B1815]">
          AI가 당신의 삶을 만들어내는 것이 아닙니다.
          <br />
          당신 안에 이미 있는 이야기를 꺼내는 것입니다.
        </p>
        <p className="mt-4 text-[16px] leading-[1.8] text-[#5C5346]">
          이 도구는 (주)디자인포비 대표 이대성이 자기 자서전을 쓰면서 만들었습니다.
          같은 질문으로, 같은 방식으로 쓴 기록입니다.
        </p>
        <Link
          href="/memoir/write"
          className="mt-6 inline-flex h-14 items-center justify-center rounded-full bg-[#8C4A32] px-8 text-[17px] font-semibold text-white"
        >
          나의 자서전 시작하기
        </Link>
      </div>
    </div>
  );
}
