"use client";

import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Estimate } from "@/types/estimate";

interface EstimateFormProps {
  projectId: string;
  designImageId: string;
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/**
 * STEP 7: AI 예상 견적. 면적(㎡)을 입력받아 참고용 가격 범위를 계산한다.
 * 실제 시공 단가가 아닌 임시값 기반이므로 화면에 명확한 안내 문구를 함께 표시한다.
 */
export function EstimateForm({ projectId, designImageId }: EstimateFormProps) {
  const [areaSqm, setAreaSqm] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    const area = Number(areaSqm);
    if (!area || area <= 0) {
      setError("면적을 올바르게 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/design/${designImageId}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaSqm: area }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "견적 계산에 실패했습니다.");
      }

      setEstimate(data.estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-border p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-accent">
        <Calculator className="h-3.5 w-3.5" />
        AI 예상 견적
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="areaSqm" className="text-xs">
            공간 면적 (㎡)
          </Label>
          <Input
            id="areaSqm"
            type="number"
            min="1"
            placeholder="예: 20"
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
          />
        </div>
        <Button onClick={handleCalculate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "견적 계산"}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {estimate && (
        <div className="mt-4 rounded-xl bg-muted/60 p-4">
          <p className="text-lg font-bold">
            {formatWon(estimate.minPrice)} ~ {formatWon(estimate.maxPrice)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {estimate.areaSqm}㎡ 기준 · ㎡당 약 {formatWon(estimate.pricePerSqm)}
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            ※ AI가 산출한 참고용 예상 범위이며, 실제 견적은 현장 실측과 자재·시공 조건에 따라
            달라질 수 있습니다. 정확한 견적은 상담을 통해 안내드립니다.
          </p>
        </div>
      )}
    </div>
  );
}
