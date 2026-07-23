"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompareSlider } from "@/components/design/CompareSlider";
import { EstimateForm } from "@/components/design/EstimateForm";
import { ROOM_TYPES, STYLES } from "@/prompts/interiorStyles";
import type { SpacePhoto } from "@/types/project";
import type { DesignImage } from "@/types/design";

const LOADING_STATUSES = [
  "공간 구조 분석 중...",
  "스타일 요소 배치 중...",
  "조명 및 색상 튜닝 중...",
  "최종 고화질 렌더링 중...",
];

interface DesignStudioProps {
  projectId: string;
  photos: SpacePhoto[];
}

/**
 * STEP 4(공간 유형 선택) + STEP 5(AI 이미지 생성) + STEP 6(AI 설명 생성) + STEP 7(AI 예상 견적) 통합 화면.
 * ReRoom AI 프로토타입의 Studio 컴포넌트를 DesignFOBEE 데이터 모델·톤앤매너로 재구현했다.
 */
export function DesignStudio({ projectId, photos }: DesignStudioProps) {
  const [sourcePhotoId, setSourcePhotoId] = useState(photos[0]?.id ?? "");
  const [roomTypeId, setRoomTypeId] = useState(ROOM_TYPES[0].id);
  const [styleId, setStyleId] = useState(STYLES[0].id);

  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DesignImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState<string | null>(null);
  const [descriptionLoading, setDescriptionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/design`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRemaining(data.remaining);
      })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // STEP 6: 결과 이미지가 생기면 곧바로 AI 설명을 생성한다.
  useEffect(() => {
    if (!result) {
      setDescription(null);
      return;
    }

    if (result.description) {
      setDescription(result.description);
      return;
    }

    setDescriptionLoading(true);
    fetch(`/api/projects/${projectId}/design/${result.id}/description`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDescription(data.description);
      })
      .catch(() => {})
      .finally(() => setDescriptionLoading(false));
  }, [result, projectId]);

  const sourcePhoto = photos.find((p) => p.id === sourcePhotoId);

  async function handleGenerate() {
    if (!sourcePhotoId) {
      setError("먼저 분석할 사진을 선택해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      const res = await fetch(`/api/projects/${projectId}/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePhotoId, roomTypeId, styleId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "AI 디자인 생성에 실패했습니다.");
      }

      setResult(data.designImage);
      setRemaining(data.remainingFree);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = `designfobee_${roomTypeId}_${styleId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (photos.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">업로드된 사진이 없습니다.</p>;
  }

  const limitReached = remaining !== null && remaining <= 0 && !result;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">나의 리디자인 스튜디오</h2>
        {remaining !== null && (
          <span className="rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            무료 체험 {remaining}회 남음
          </span>
        )}
      </div>

      {result && sourcePhoto ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
          <div className="text-center">
            <span className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-foreground">
              Redesign Complete
            </span>
            <h3 className="mt-4 text-xl font-bold">새로운 공간이 완성되었습니다</h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {STYLES.find((s) => s.id === styleId)?.label} 스타일
            </p>
          </div>

          <CompareSlider
            beforeSrc={sourcePhoto.url}
            afterSrc={result.url}
            beforeAlt="업로드한 원본 공간"
            afterAlt="리디자인된 공간"
          />

          {/* STEP 6: AI 설명 */}
          <div className="w-full rounded-2xl border border-border bg-muted/40 p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              AI 디자이너 노트
            </div>
            {descriptionLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                설명을 작성하고 있습니다...
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">{description}</p>
            )}
          </div>

          {/* STEP 7: AI 예상 견적 */}
          <EstimateForm projectId={projectId} designImageId={result.id} />

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={handleDownload}>고화질 PNG 다운로드</Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              다른 스타일로 다시 디자인
            </Button>
          </div>

          {/* STEP 8: AI 디자인 결과를 첨부한 상담 신청 */}
          <a
            href={`/consult/${projectId}/${result.id}`}
            className="text-sm font-semibold text-accent underline underline-offset-4"
          >
            이 디자인으로 상담 신청하기 →
          </a>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold">01. 분석할 사진 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSourcePhotoId(photo.id)}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                    sourcePhotoId === photo.id ? "border-accent" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.originalName} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold">02. 공간 유형</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setRoomTypeId(room.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      roomTypeId === room.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {room.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold">03. 디자인 스타일</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setStyleId(style.id)}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                      styleId === style.id ? "border-accent bg-accent/5" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <span className="flex gap-1">
                      {style.swatch.map((color) => (
                        <span key={color} className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span className="text-xs font-bold">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            {limitReached && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
                무료 체험 횟수를 모두 사용하셨습니다. 담당자와 상담을 통해 계속 이용하실 수 있습니다.{" "}
                <a href="/#contact" className="font-semibold underline underline-offset-4">
                  상담 신청하기
                </a>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button size="lg" disabled={loading || limitReached} onClick={handleGenerate}>
              {loading ? "생성 중..." : "AI 인테리어 디자인 생성하기"}
            </Button>

            {loading && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-8">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <p className="text-sm font-medium" aria-live="polite">
                  {LOADING_STATUSES[loadingStep]}
                </p>
                <p className="text-xs text-muted-foreground">첫 생성에는 약 10초가 소요됩니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
