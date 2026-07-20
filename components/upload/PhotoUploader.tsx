"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpacePhoto } from "@/types/project";

/**
 * STEP 3 핵심 컴포넌트. 첫 파일 선택 시 프로젝트를 생성하고,
 * 이후 파일들은 같은 프로젝트에 계속 업로드한다.
 */
export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<SpacePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function ensureProject(): Promise<string> {
    if (projectId) return projectId;

    const res = await fetch("/api/projects", { method: "POST" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error ?? "프로젝트 생성에 실패했습니다.");
    }

    setProjectId(data.project.id);
    return data.project.id;
  }

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    setError(null);

    try {
      const id = await ensureProject();

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/projects/${id}/photos`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "사진 업로드에 실패했습니다.");
        }

        setPhotos((prev) => [...prev, data.photo]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  }

  function goToAnalysis() {
    if (projectId) router.push(`/analyze/${projectId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">사진을 드래그하거나 클릭해서 업로드하세요</p>
        <p className="text-xs text-muted-foreground">JPG, PNG · 최대 10MB</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelect}
        />
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          업로드 중...
        </div>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.originalName} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          아직 업로드된 사진이 없습니다.
        </div>
      )}

      <Button size="lg" disabled={photos.length === 0} onClick={goToAnalysis}>
        다음 단계 (AI 공간 분석)
      </Button>
    </div>
  );
}
