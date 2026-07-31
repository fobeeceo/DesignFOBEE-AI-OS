import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { COMPANY } from "@/lib/company/profile";
import {
  getAllStorySlugs,
  getGalleryForStory,
  getStoryBySlug,
} from "@/lib/projects/stories";

interface PageProps {
  params: { slug: string };
}

/**
 * 스토리가 있는 slug만 정적 생성한다. 지금은 스토리가 없어 아무 페이지도 만들어지지 않으며,
 * /projects/* 접근은 전부 404가 된다 — 빈 껍데기 페이지를 노출하지 않기 위한 의도된 동작이다.
 */
export function generateStaticParams() {
  return getAllStorySlugs().map((slug) => ({ slug }));
}

/** SEO — 스토리 데이터에서 title/description/OG/canonical을 자동 생성한다. */
export function generateMetadata({ params }: PageProps): Metadata {
  const story = getStoryBySlug(params.slug);
  if (!story) return {};

  const title = `${story.title} — ${story.category} 인테리어 시공사례`;
  const description = story.summary;
  const url = `/projects/${story.slug}`;
  const image = `/images/portfolio/website/${story.coverSlug}.webp`;

  return {
    title,
    description,
    keywords: [story.category, story.location, "인테리어", "시공사례", ...(story.keywords ?? [])],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [{ url: image, alt: story.title }],
    },
  };
}

export default function ProjectStoryPage({ params }: PageProps) {
  const story = getStoryBySlug(params.slug);
  if (!story) notFound();

  const gallery = getGalleryForStory(story);

  // 검색엔진이 시공사례를 구조화 데이터로 인식하도록 JSON-LD를 함께 제공한다.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: story.title,
    description: story.summary,
    dateCreated: story.year,
    locationCreated: { "@type": "Place", name: story.location },
    creator: { "@type": "Organization", name: COMPANY.name },
    image: `/images/portfolio/website/${story.coverSlug}.webp`,
  };

  return (
    <>
      <Header />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="relative isolate">
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <Image
              src={`/images/portfolio/website/${story.coverSlug}.webp`}
              alt={`${story.title} 시공 사례`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container-px mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {story.category}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{story.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {story.location} · {story.year}
            </p>

            <div className="mt-10 flex flex-col gap-10">
              <div>
                <h2 className="text-lg font-semibold">과제</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {story.challenge}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold">해결 방법</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {story.approach}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold">결과</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {story.result}
                </p>
              </div>
            </div>
          </div>
        </section>

        {story.beforeAfter && story.beforeAfter.length > 0 && (
          <section className="bg-muted/40 py-16 sm:py-20">
            <div className="container-px mx-auto max-w-5xl">
              <SectionHeading eyebrow="Before / After" title="시공 전과 후" />
              <div className="mt-10 flex flex-col gap-10">
                {story.beforeAfter.map((pair) => (
                  <figure key={pair.caption}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { slug: pair.beforeSlug, label: "시공 전" },
                        { slug: pair.afterSlug, label: "시공 후" },
                      ].map((side) => (
                        <div key={side.label}>
                          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                            <Image
                              src={`/images/portfolio/website/${side.slug}.webp`}
                              alt={`${story.title} ${side.label}`}
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-accent">{side.label}</p>
                        </div>
                      ))}
                    </div>
                    <figcaption className="mt-3 text-sm text-muted-foreground">
                      {pair.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="py-16 sm:py-20">
            <div className="container-px mx-auto max-w-6xl">
              <SectionHeading eyebrow="Gallery" title="시공 사진" />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((item) => (
                  <figure key={item.slug} className="overflow-hidden rounded-2xl">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={`/images/portfolio/website/${item.slug}.webp`}
                        alt={item.caption}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-border py-16 sm:py-20">
          <div className="container-px mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <p className="text-lg font-semibold">이런 공간을 계획하고 계신가요?</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/#contact" className={buttonVariants({ size: "lg" })}>
                상담 신청하기
              </Link>
              <Link
                href="/#portfolio"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                다른 시공사례 보기
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
