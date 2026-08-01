"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { WORK_GALLERY } from "@/lib/portfolio/workGallery";
import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/**
 * GBRICK Coffee 직영·가맹점 — 출처: 지명원·정보공개서.
 * 매장별 사진 매핑은 2026-07-28 CEO 최종 확인 기준. 은평본점 사진은 2026-07-29 대표님이
 * "디자인포비작업사진2"(야간 매장 외관 IMG_8205)를 본점으로 직접 확인해주셔서 반영.
 */
const GBRICK_STORES = [
  { name: "GBRICK Coffee 은평본점", location: "서울 은평구", meta: "직영 1호점 · 2013", image: "/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp" },
  { name: "GBRICK Coffee 안산점", location: "경기 안산시", meta: "가맹점 시공", image: "/images/portfolio/gbrick-ansan.jpg" },
  // 폐점 매장 — 카드에서 제외한다(2026-08-01 대표 지시). 데이터·사진은 남겨두고 노출만 막는다.
  { name: "GBRICK Coffee 단대점", location: "경기 성남시", meta: "2013", image: "/images/portfolio/gbrick-dandae.jpg", hidden: true },
  { name: "GBRICK Coffee 삼송점", location: "경기 고양시 삼송", meta: "가맹점 시공", image: "/images/portfolio/gbrick-samsong.jpg" },
  { name: "GBRICK Coffee 신길점", location: "경기", meta: "가맹점 시공", image: "/images/portfolio/gbrick-singil.jpg" },
];

/**
 * 대표 시공 사례 — GBRICK Coffee 매장 + Google Drive 실사진(디자인포비작업사진, 매장명 미상은
 * 공간 용도로만 표기). "카페" 카테고리는 매장 카드와 일반 카페 사진이 함께 표시된다.
 */
type Project = { name: string; category: string; image?: string; location?: string; meta?: string };

const PROJECTS: Project[] = [
  ...GBRICK_STORES.filter((s) => !s.hidden).map((s) => ({ name: s.name, category: "카페 · 커피전문점", image: s.image, location: s.location, meta: s.meta })),
  ...WORK_GALLERY.map((item) => ({
    name: item.caption,
    category: item.category,
    image: `/images/portfolio/website/${item.slug}.webp`,
  })),
];

function ProjectCard({ project, featured }: { project: Project; featured?: boolean }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-primary shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl ${
        featured ? "aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto" : "aspect-[4/5]"
      }`}
    >
      {project.image ? (
        <Image
          src={project.image}
          alt={project.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(min-width: 640px) 33vw, 100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b2620] to-[#4a3d2e]">
          {/* 실제 사진 준비 전까지의 플레이스홀더 — 추측 이미지 대신 톤만 표시 */}
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        </div>
      )}

      {/* 정보 오버레이 */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-5">
        <span className="mb-2 inline-flex w-fit rounded-full bg-accent/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          {project.category}
        </span>
        <p className={`font-bold text-primary-foreground ${featured ? "text-xl sm:text-2xl" : "text-base"}`}>
          {project.name}
        </p>
        {project.location && (
          <div className="mt-1 flex items-center gap-2 text-xs text-primary-foreground/70">
            <span>{project.location}</span>
            {project.meta && <span className="opacity-60">· {project.meta}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORIES = ["전체", ...Array.from(new Set(PROJECTS.map((p) => p.category.split(" ")[0])))];

export function PortfolioSection() {
  const [cat, setCat] = useState("전체");
  const filtered = cat === "전체" ? PROJECTS : PROJECTS.filter((p) => p.category.startsWith(cat));

  return (
    <section id="portfolio" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Portfolio"
          title={`${yearsSince(FOUNDED_YEAR)}년의 경험이 만든 공간들`}
          description="GBRICK Coffee 매장을 비롯해 카페·리테일·오피스 등 다양한 공간을 직접 설계·시공해왔습니다."
        />

        {/* 카테고리 필터 */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                cat === c
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {filtered.map((project, i) => (
            <ProjectCard key={project.name} project={project} featured={cat === "전체" && i === 0} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">이런 공간을 만들고 싶으신가요?</p>
          <a href="/#contact" className={buttonVariants({ size: "lg", className: "mt-4" })}>
            지금 상담 신청하기
          </a>
        </div>
      </div>
    </section>
  );
}
