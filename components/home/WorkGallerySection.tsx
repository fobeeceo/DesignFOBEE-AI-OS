import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { WORK_GALLERY } from "@/lib/portfolio/workGallery";

function GalleryCard({ item }: { item: (typeof WORK_GALLERY)[number] }) {
  const spanClass =
    item.span === "wide"
      ? "sm:col-span-2 aspect-[16/9]"
      : item.span === "tall"
        ? "row-span-2 aspect-[3/4]"
        : "aspect-[4/3]";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-primary shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl ${spanClass}`}
    >
      <Image
        src={`/images/portfolio/website/${item.slug}.webp`}
        alt={item.caption}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        sizes="(min-width: 640px) 33vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <span className="mb-1.5 inline-flex w-fit rounded-full bg-accent/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          {item.category}
        </span>
        <p className="text-sm font-medium text-primary-foreground">{item.caption}</p>
      </div>
    </div>
  );
}

export function WorkGallerySection() {
  return (
    <section id="work-gallery" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Our Work"
          title="다양한 공간, 하나의 완성도"
          description="카페·리테일·오피스까지 — 디자인포비가 직접 설계·시공한 공간들입니다."
        />
        <div className="mt-8 grid auto-rows-[1fr] grid-cols-1 gap-4 sm:grid-cols-3">
          {WORK_GALLERY.map((item) => (
            <GalleryCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
