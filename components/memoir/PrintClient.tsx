"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PARTS } from "@/lib/memoir/questions";
import { buildManuscript } from "@/lib/memoir/manuscript";
import { useMemoirBook } from "@/lib/memoir/storage";
import {
  REVIEW_NOTICE,
  manuscriptFileName,
  splitParagraphs,
  summaryLine,
  today,
} from "@/lib/memoir/exportDoc";

/**
 * PDF로 저장하기 위한 인쇄 화면.
 *
 * 왜 파일을 직접 만들지 않는가 — 브라우저에서 한글 PDF를 만들려면 한글 글꼴 파일
 * 전체(수 MB)를 내려받아 문서에 심어야 한다. 주 사용자가 휴대폰을 쓰는 40~80대라
 * 그 용량을 감당시키기 어렵고, 글꼴에 없는 글자가 하나라도 나오면 이름이 네모로
 * 깨진다. 자기 자서전에서 자기 이름이 깨지는 건 가장 나쁜 실패다.
 *
 * 브라우저의 인쇄 기능은 이미 그 글꼴을 갖고 있다. 한글이 깨질 일이 없고, 쪽 나눔도
 * 브라우저가 맡는다. 그래서 "PDF 파일을 만들어 주는" 대신 "PDF로 저장할 수 있는
 * 화면"을 만든다. 화면 문구도 그대로 적는다 — 없는 기능을 있는 것처럼 쓰지 않는다.
 */
export function PrintClient() {
  const { book, ready } = useMemoirBook();
  const manuscript = useMemo(() => buildManuscript(book), [book]);
  const fileName = manuscriptFileName(book.title, "pdf");

  return (
    <>
      {/* 안내 — 인쇄물에는 나오지 않는다 */}
      <div className="no-print mx-auto max-w-3xl px-5 pb-8 pt-8">
        <Link href="/memoir/book" className="text-[15px] text-[#8C4A32] underline underline-offset-4">
          ← 내 원고로 돌아가기
        </Link>

        <div className="mt-4 rounded-2xl border-2 border-[#8C4A32] bg-[#FDF7F3] p-5">
          <p className="text-[17px] font-bold text-[#8C4A32]">PDF로 저장하는 방법</p>
          <ol className="mt-3 space-y-1.5 text-[16px] leading-[1.8] text-[#5C5346]">
            <li>1. 아래 「인쇄 화면 열기」를 누릅니다.</li>
            <li>
              2. 프린터를 고르는 자리에서 <strong className="font-semibold text-[#1B1815]">
              &lsquo;PDF로 저장&rsquo;</strong>을 고릅니다.
              <span className="block text-[14px] text-[#6B6255]">
                아이폰은 공유 → 프린트 → 미리보기를 두 손가락으로 벌린 뒤 공유 → 파일에 저장
              </span>
            </li>
            <li>
              3. 파일 이름은 <strong className="font-semibold text-[#1B1815]">{fileName}</strong>{" "}
              으로 적으시면 나중에 찾기 쉽습니다.
            </li>
          </ol>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={!ready || manuscript.length === 0}
            className="mt-4 h-14 w-full rounded-full bg-[#8C4A32] text-[17px] font-semibold text-white disabled:opacity-40"
          >
            인쇄 화면 열기
          </button>

          {ready && manuscript.length === 0 && (
            <p className="mt-3 text-[15px] text-[#8C4A32]">
              아직 쓴 글이 없습니다. 먼저 질문에 답해 주세요.
            </p>
          )}

          <p className="mt-4 text-[14px] leading-relaxed text-[#6B6255]">
            브라우저의 인쇄 기능을 그대로 씁니다. 그래서 한글이 깨지지 않고, 쪽 나눔도
            정확합니다. 원고는 이 기기 밖으로 나가지 않습니다.
          </p>
        </div>
      </div>

      {/* 인쇄 대상 */}
      <article className="print-sheet mx-auto max-w-3xl bg-white px-5 py-10 text-[#1B1815] sm:px-12">
        <header className="cover">
          <h1 className="text-center text-[34px] font-bold leading-[1.3] sm:text-[42px]">
            {book.title.trim() || "제목 없음"}
          </h1>
          {book.subtitle.trim() && (
            <p className="mt-4 text-center text-[17px] text-[#5C5346]">{book.subtitle.trim()}</p>
          )}
          {book.author.trim() && (
            <p className="mt-10 text-center text-[16px]">{book.author.trim()} 지음</p>
          )}
          <p className="mt-2 text-center text-[14px] text-[#8C8172]">{today()} 만듦</p>
          <p className="mt-8 text-center text-[13px] text-[#8C8172]">{summaryLine(book)}</p>
          <p className="mt-3 text-center text-[15px] font-semibold text-[#8C4A32]">
            {REVIEW_NOTICE}
          </p>
        </header>

        {manuscript.map((item, i) => {
          const part = PARTS.find((x) => x.id === item.chapter.partId);
          const isNewPart =
            i === 0 || manuscript[i - 1].chapter.partId !== item.chapter.partId;

          return (
            <section key={item.chapter.id} className={isNewPart ? "part-start" : "chapter"}>
              {isNewPart && part && (
                <p className="part-title text-center text-[24px] font-bold">
                  {part.label} — {part.title}
                </p>
              )}

              <h2 className="mt-10 text-[24px] font-bold">{item.chapter.title}</h2>
              <p className="mt-1 text-[14px] italic text-[#8C8172]">{item.chapter.subtitle}</p>

              {item.entries.map((entry, j) => (
                <div key={`${item.chapter.id}-${j}`} className="entry mt-7">
                  <p className="text-[14px] font-semibold text-[#8C4A32]">{entry.heading}</p>
                  {splitParagraphs(entry.body).map((line, k) => (
                    <p key={k} className="mt-3 text-[16px] leading-[1.9]">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </section>
          );
        })}
      </article>
    </>
  );
}
