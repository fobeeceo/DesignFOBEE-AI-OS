import { NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_HQ_STATS, MOCK_TOP_MENUS, MOCK_WEEKLY_REVENUE, MOCK_STORE_STATS } from "@/lib/gbrick/mockData";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function buildPrompt(stats: typeof MOCK_HQ_STATS, storeStats: typeof MOCK_STORE_STATS, topMenus: typeof MOCK_TOP_MENUS, weekly: typeof MOCK_WEEKLY_REVENUE): string {
  const revenueGrowth = ((stats.today.revenue - stats.yesterday.revenue) / stats.yesterday.revenue * 100).toFixed(1);
  const orderGrowth = ((stats.today.orders - stats.yesterday.orders) / stats.yesterday.orders * 100).toFixed(1);

  return `당신은 GBRICK Coffee 프랜차이즈 경영 AI 어시스턴트입니다. 오늘의 경영 현황을 분석하고 CEO에게 간결한 한국어 브리핑을 작성해주세요.

[오늘 현황]
- 매출: ${stats.today.revenue.toLocaleString()}원 (전일 대비 ${revenueGrowth}%)
- 주문 수: ${stats.today.orders}건 (전일 대비 ${orderGrowth}%)
- 신규 고객: ${stats.today.newCustomers}명
- 평균 객단가: ${stats.today.avgOrderValue.toLocaleString()}원

[이번 달]
- 누적 매출: ${stats.thisMonth.revenue.toLocaleString()}원
- 누적 주문: ${stats.thisMonth.orders}건
- 전월 대비: ${((stats.thisMonth.revenue - stats.lastMonth.revenue) / stats.lastMonth.revenue * 100).toFixed(1)}%

[매장별 오늘 매출]
${storeStats.map((s) => `- ${s.storeName}: ${s.todayRevenue.toLocaleString()}원 (${s.todayOrders}건)`).join("\n")}

[이번 달 TOP 메뉴 (전체)]
${topMenus.slice(0, 3).map((m, i) => `${i + 1}. ${m.name}: ${m.count}잔, ${m.revenue.toLocaleString()}원`).join("\n")}

다음 형식으로 브리핑을 작성해주세요:
1. 오늘 한줄 요약 (1문장)
2. 주요 성과 (2-3개 bullet)
3. 주의 사항 또는 개선 포인트 (1-2개)
4. 내일을 위한 제안 (1-2개)

300자 이내로 간결하게 작성해주세요.`;
}

export async function GET() {
  try {
    const stats = MOCK_HQ_STATS;
    const storeStats = MOCK_STORE_STATS;
    const topMenus = MOCK_TOP_MENUS;
    const weekly = MOCK_WEEKLY_REVENUE;

    if (IS_MOCK_MODE && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        briefing: `📊 오늘 GBRICK Coffee 전체 매출 2,847,000원으로 전일 대비 8.9% 성장했습니다.\n\n✅ 주요 성과\n• 신촌점 하루 매출 1,245,000원으로 전 매장 1위 달성\n• 신규 고객 28명 유입, 이번 달 누계 487명\n• 지브릭 라떼 오늘도 1위 유지\n\n⚠️ 주의 사항\n• 강남점 오픈 준비 중 — 운영 준비 상황 점검 필요\n• 이태원점 매출 목표 대비 15% 미달\n\n💡 내일 제안\n• 홍대점 저녁 시간대 프로모션 검토\n• 이태원점 메뉴 다양성 강화 고려`,
        generatedAt: new Date().toISOString(),
        mock: true,
        source: "mock",
      });
    }

    const prompt = buildPrompt(stats, storeStats, topMenus, weekly);

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer proxy-injected",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Gemini API error]", response.status, errText);
      return NextResponse.json({ error: "AI 브리핑 생성 실패", detail: errText }, { status: 502 });
    }

    const data = await response.json();
    const briefing = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "브리핑을 생성할 수 없습니다.";

    return NextResponse.json({ briefing, generatedAt: new Date().toISOString(), source: "gemini" });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/ai/briefing]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
