"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { WORK_GALLERY } from "@/lib/portfolio/workGallery";
import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/**
 * GBRICK Coffee 직영·가맹점 — 출처: 지명원·정보공개서 + 2026-08-01 대표 매장 현황 확정.
 * 은평본점 사진은 2026-07-29 대표님이 "디자인포비작업사진2"(야간 외관 IMG_8205)로 직접 확인.
 *
 * ⚠️ 포트폴리오는 "우리가 이 공간을 설계·시공했다"는 사실만 말한다(2026-08-01 대표 지시).
 *    지금도 영업 중인지는 여기서 말하지 않는다 — 폐점해도 시공한 사실은 변하지 않지만,
 *    현재형으로 쓰면 폐점 매장을 영업 중인 것처럼 오인시키기 때문이다.
 *    운영 성과는 가맹 성공사례(lib/franchise/successCases.ts)에서만 다룬다.
 */
const GBRICK_STORES = [
  { name: "GBRICK Coffee 은평본점", location: "서울 은평구", meta: "2013 설계·시공", image: "/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp" },
  // 안산점과 신길점은 동일 매장이다(2026-08-01 대표 확인). 사진 2장은 같은 공간의 다른 각도라
  // 두 매장인 것처럼 각각 카드로 두지 않고, 안산점 한 곳의 시공 사진으로 묶는다.
  { name: "GBRICK Coffee 안산점", location: "경기 안산시", meta: "설계·시공", image: "/images/portfolio/gbrick-singil.jpg" },
  { name: "GBRICK Coffee 안산점 — 브랜드 월", location: "경기 안산시", meta: "설계·시공", image: "/images/portfolio/gbrick-ansan.jpg" },
  // 폐점 매장 — 카드에서 제외한다(2026-08-01 대표 지시). 데이터·사진은 남겨두고 노출만 막는다.
  // 단대점: 2013 오픈 → 2023 승계 → 2024 폐점(승계 실패).
  { name: "GBRICK Coffee 단대점", location: "경기 성남시", meta: "2013 설계·시공", image: "/images/portfolio/gbrick-dandae.jpg", hidden: true },
  // 삼송점은 실재하지 않는 매장이다(2026-08-01 대표 확인, 원흥점의 착오).
  // gbrick-samsong.jpg에도 GBRICK 브랜딩이 없어 시공 근거를 확인할 수 없어 노출을 막는다.
  // 원흥점 사진으로 확인되면 이름을 고쳐 되살릴 수 있도록 파일과 항목은 남긴다.
  { name: "GBRICK Coffee 삼송점", location: "경기 고양시 삼송", meta: "설계·시공", image: "/images/portfolio/gbrick-samsong.jpg", hidden: true },
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
