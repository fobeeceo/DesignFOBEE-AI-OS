import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFeaturedStories, hasStories } from "@/lib/projects/stories";

/**
 * 프로젝트 스토리 요약 — 홈에는 요약만, 전체 내용은 /projects/[slug]에서 보여준다
 * (CLAUDE.md §14-A ④).
 *
 * 스토리가 하나도 없으면 아무것도 렌더링하지 않는다. 실제 자료가 들어오기 전까지
 * 빈 섹션이나 "준비 중" 같은 문구를 노출하지 않기 위함이다(§14-A ②).
 */
export function StoriesSection() {
  if (!hasStories()) return null;

  const stories = getFeaturedStories(3);

  return (
    <section id="stories" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Project Stories"
          title="어떻게 만들었는지 이야기합니다"
          description="공간마다 조건이 다릅니다. 어떤 과제가 있었고 어떻게 풀었는지 기록했습니다."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Link
              key={story.slug}
              href={`/projects/${story.slug}`}
              className="group overflow-hidden rounded-2xl border border-border transition-colors hover:border-accent"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={`/images/portfolio/website/${story.coverSlug}.webp`}
                  alt={story.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-accent">{story.category}</p>
                <h3 className="mt-1 font-semibold">{story.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {story.summary}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {story.location} · {story.year}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
