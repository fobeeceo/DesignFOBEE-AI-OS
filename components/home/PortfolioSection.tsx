import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";

type Project = {
  name: string;
  category: string;
  location: string;
  meta?: string;
  /** public/images/portfolio/ 에 실제 사진을 넣으면 자동 표시됩니다 (예: /images/portfolio/eunpyeong.jpg) */
  image?: string;
  /** 카테고리별 색감 (실제 이미지가 없을 때의 에디토리얼 톤) */
  tone: string;
};

/**
 * 대표 시공 사례 — 실제 프로젝트로 구성 (출처: 지명원·정보공개서).
 * 이미지 원본은 Google Drive(지브릭프랜차이즈>사진/지명원)에 있으며,
 * public/images/portfolio/ 에 배치하면 `image` 필드로 즉시 교체된다.
 */
const PROJECTS: Project[] = [
  {
    name: "GBRICK Coffee 은평본점",
    category: "카페 · 커피전문점",
    location: "서울 은평구",
    meta: "직영 1호점 · 2013",
    tone: "from-[#2b2620] to-[#4a3d2e]",
  },
  {
    name: "GBRICK Coffee 안산점",
    category: "카페 · 커피전문점",
    location: "경기 안산시",
    meta: "가맹점 시공",
    tone: "from-[#3a2e28] to-[#6b4a33]",
  },
  {
    name: "GBRICK Coffee 단대점",
    category: "카페 · 커피전문점",
    location: "경기 성남시",
    meta: "2013",
    tone: "from-[#26302b] to-[#3f5748]",
  },
  {
    name: "GBRICK Coffee 삼송점",
    category: "카페 · 커피전문점",
    location: "경기 고양시 삼송",
    meta: "가맹점 시공",
    tone: "from-[#302a24] to-[#5c5148]",
  },
  {
    name: "GBRICK Coffee 신길점",
    category: "카페 · 커피전문점",
    location: "경기",
    meta: "가맹점 시공",
    tone: "from-[#2a2620] to-[#8a6f52]",
  },
  {
    name: "디자인포비 사무실",
    category: "오피스 · 업무공간",
    location: "서울",
    meta: "2013",
    tone: "from-[#242a30] to-[#4a5a66]",
  },
];

function ProjectCard({ project, featured }: { project: Project; featured?: boolean }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-primary ${
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
        <div className={`absolute inset-0 bg-gradient-to-br ${project.tone}`}>
          {/* 에디토리얼 톤 — 실제 사진 배치 전까지의 프로페셔널 플레이스홀더 */}
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
          <span
            aria-hidden
            className="absolute right-5 top-4 font-bold leading-none text-primary-foreground/10"
            style={{ fontSize: featured ? "9rem" : "5rem" }}
          >
            {project.name.includes("GBRICK") ? "G" : "F"}
          </span>
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
        <div className="mt-1 flex items-center gap-2 text-xs text-primary-foreground/70">
          <span>{project.location}</span>
          {project.meta && <span className="opacity-60">· {project.meta}</span>}
        </div>
      </div>
    </div>
  );
}

export function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Portfolio"
          title="26년의 경험이 만든 공간들"
          description="GBRICK Coffee 브랜드 매장을 비롯해 상업공간·오피스 등 다양한 공간을 직접 설계·시공해왔습니다."
        />

        <div className="mt-14 grid auto-rows-[1fr] grid-cols-1 gap-4 sm:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.name} project={project} featured={i === 0} />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          GBRICK Coffee 7개 매장 · 3년간 폐점 0건 · 평균 운영 10년 이상의 신뢰
        </p>
      </div>
    </section>
  );
}
