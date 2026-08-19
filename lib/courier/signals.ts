/**
 * 전령 역할 ① — 내부 신호 감지.
 *
 * ERP 실데이터와 QA/Audit 결과를 규칙으로 훑어 "대표에게 옮길 만한 것"만 봉투로 만든다.
 * LLM을 쓰지 않는다 — 같은 데이터면 같은 결과가 나와야 하고, 재고 수치를 문장으로 바꾸는 데
 * 추론이 필요하지 않기 때문이다(ceo_agent.py와 같은 판단).
 *
 * 본문의 모든 숫자는 넘겨받은 데이터에서 계산한다. 숫자를 문자열로 박아두지 않는다(§0-2 원칙 5).
 */

import { ERP_SNAPSHOT } from "@/lib/hq/erpSnapshot";
import type { ErpData } from "@/lib/hq/types";
import type { EnvelopeDraft } from "./types";

/** 원가율 경보 임계치(%). 평균 원가율(22.6%)보다 뚜렷이 높은 메뉴만 걸러낸다. */
export const COST_RATIO_ALERT = 30;

export interface QualitySignalInput {
  /** `npm run qa` 실패 건수. 모르면 넘기지 않는다(0과 "모름"은 다르다). */
  qaFailures?: number;
  /** `npm run audit` 실패 건수. */
  auditFailures?: number;
}

/** ERP·품질 데이터에서 전달할 가치가 있는 신호만 골라 봉투 원안으로 만든다. */
export function detectSignals(erp: ErpData = ERP_SNAPSHOT, quality: QualitySignalInput = {}): EnvelopeDraft[] {
  const drafts: EnvelopeDraft[] = [];
  const erpSource = `ERP ${erp.store} · 기준일 ${erp.updatedAt}`;

  const urgent = erp.inventory.reorders.filter((item) => item.urgent);
  if (urgent.length > 0) {
    drafts.push({
      id: `signal:inventory-urgent:${erp.updatedAt}`,
      origin: "내부신호",
      priority: "긴급",
      audience: "대표",
      subject: `긴급 발주 ${urgent.length}건 — 재고 소진`,
      body: [
        `재고가 바닥난 품목이 ${urgent.length}건 있습니다.`,
        ...urgent.map((item) => `- ${item.item}: 현재 ${item.current} / 적정 ${item.safe} → ${item.order} 발주 필요`),
      ].join("\n"),
      source: erpSource,
    });
  }

  const pending = erp.inventory.purchaseOrders.filter((order) => order.approvalStatus === "대기");
  if (pending.length > 0) {
    const unpriced = pending.filter((order) => order.estimatedCost === null).length;
    drafts.push({
      id: `signal:purchase-pending:${erp.updatedAt}`,
      origin: "내부신호",
      priority: "중요",
      audience: "대표",
      subject: `발주 승인 대기 ${pending.length}건`,
      body: [
        `승인을 기다리는 발주서 초안이 ${pending.length}건입니다.`,
        ...pending.map((order) => `- ${order.id} ${order.item} × ${order.order} (${order.supplier})`),
        unpriced > 0
          ? `\n※ ${unpriced}건은 공급단가가 확정되지 않아 예상금액을 계산하지 못했습니다(추정하지 않음).`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      source: erpSource,
    });
  }

  const costly = erp.cost.menus.filter((menu) => menu.ratio >= COST_RATIO_ALERT);
  if (costly.length > 0) {
    drafts.push({
      id: `signal:cost-ratio:${erp.updatedAt}`,
      origin: "내부신호",
      priority: "중요",
      audience: "본사",
      subject: `원가율 ${COST_RATIO_ALERT}% 이상 메뉴 ${costly.length}건`,
      body: [
        `평균 원가율 ${erp.cost.avgRatio}% 대비 높은 메뉴입니다.`,
        ...costly.map((menu) => `- ${menu.name}: ${menu.ratio}% (판매가 ${menu.price.toLocaleString()}원)`),
      ].join("\n"),
      source: `${erpSource} · 09_MENU_COST_TABLE`,
    });
  }

  // menuEngineering은 available 여부로 갈리는 유니온이다. 계산이 안 된 날에는 신호를 만들지 않는다.
  const discontinue = erp.menuEngineering.available ? erp.menuEngineering.단종후보 : [];
  if (discontinue.length > 0) {
    drafts.push({
      id: `signal:menu-discontinue:${erp.updatedAt}`,
      origin: "내부신호",
      priority: "일반",
      audience: "본사",
      subject: `단종 후보 ${discontinue.length}건 — 메뉴 엔지니어링`,
      body: [
        "판매량×마진 매트릭스에서 Dog로 분류된 메뉴입니다. 판단은 사람이 합니다.",
        ...discontinue.map((row) => `- ${row.메뉴}: 판매량 ${row.판매량} · 마진 ${row.마진.toLocaleString()}원 · 원가율 ${row.원가율}%`),
      ].join("\n"),
      source: `${erpSource} · erp_engine.menu_engineering`,
    });
  }

  const qualityFailures = (quality.qaFailures ?? 0) + (quality.auditFailures ?? 0);
  if (qualityFailures > 0) {
    drafts.push({
      id: `signal:quality-failure:${erp.updatedAt}`,
      origin: "내부신호",
      priority: "긴급",
      audience: "본사",
      subject: `QA/Audit 실패 ${qualityFailures}건 — 배포 중단 대상`,
      body: [
        `QA 실패 ${quality.qaFailures ?? 0}건, Audit 실패 ${quality.auditFailures ?? 0}건입니다.`,
        "CLAUDE.md §9 ⑩ — QA 미통과 시 배포하지 않습니다.",
      ].join("\n"),
      source: "npm run qa · npm run audit 실행 결과",
    });
  }

  return drafts;
}
