import type { Metadata } from "next";
import { PhotoUploader } from "@/components/upload/PhotoUploader";

export const metadata: Metadata = {
  title: "사진 업로드",
  description: "공간 사진을 업로드하고 AI 분석을 시작하세요.",
};

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">공간 사진 업로드</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          분석하고 싶은 공간의 사진을 올려주세요. 여러 장 업로드할수록 AI 분석 정확도가 높아집니다.
        </p>
      </div>

      <PhotoUploader />
    </div>
  );
}
