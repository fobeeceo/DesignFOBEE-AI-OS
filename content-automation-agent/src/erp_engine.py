"""
erp_engine.py — GBRICK AI ERP 계산 엔진 (실데이터 기반 MVP).
SSOT = Google Drive 마스터(MENU/RECIPE/INVENTORY). 여기 embedded 스냅샷은 실제 Drive 값(2026-07 기준).
계산 체인: 레시피 → 원재료 차감 → 재고 계산 → 안전재고 확인 → 자동 발주 추천 → 원가 계산 → 일일 리포트.
기존 구조 무변경 — content-automation-agent/src 에 연결만.
"""
from __future__ import annotations
import json
import datetime
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "output"
OUT.mkdir(exist_ok=True)

# ── SSOT 스냅샷 (Drive 01_MENU_MASTER v1.4 · 09_MENU_COST_TABLE · 05_RECIPE_ADE · 재고관리 DB 2026-07-05) ──
MENU = {  # 메뉴: (판매가, 원가율)  ← 실제 매장가/원가율
    "에스프레소": (2500, 0.209), "아메리카노": (3500, 0.241), "카페라떼": (4400, 0.269),
    "카페모카": (5400, 0.309), "레몬에이드": (5500, 0.144), "자몽에이드": (5500, 0.076),
    "자바칩프라페": (6500, 0.298), "팥빙수": (12000, 0.207), "망고빙수": (15000, 0.284),
}
RECIPE = {  # 메뉴 → {재료: 사용량}  (05_RECIPE_ADE v1.1)
    "레몬에이드": {"레몬청": 70, "탄산수": 180}, "자몽에이드": {"자몽청": 50, "탄산수": 180},
    "오미자에이드": {"오미자청": 50, "탄산수": 180}, "패션후르츠에이드": {"패션후르츠청": 70, "탄산수": 180},
}
OPTIONS = {  # 실제 옵션 단가 (01_OPTION_MASTER v1.2 · MENU_MASTER 포장정책 · INGREDIENT_MASTER)
    "두유": 300, "무가당두유": 300, "오트밀크": 500, "아몬드브리즈": 300,
    "샷추가": 500, "사이즈업": 500, "포장할인_음료": -1000, "포장할인_아메리카노": -1500,
}
INGREDIENT_GROUPS = {  # 01_INGREDIENT_MASTER v1.0 코드체계 (품목 수)  ※ 절대단가는 SUPPLIER 매핑 대기
    "원두": 3, "우유": 4, "시럽": 5, "파우더": 9, "과일청": 7, "프라페과일": 5, "티": 5,
    "디저트": 9, "탄산": 1, "컵": 4, "빨대": 5,
}
INVENTORY = [  # (품목, 현재수량, 적정수량)  ← 재고관리 DB 2026-07-05 실측
    ("디카페인원두", 3, 4), ("우유", 1, 10), ("오트밀크", 1.5, 4), ("일반두유", 0.5, 10),
    ("무당두유", 3.5, 10), ("탄산수", 2, 10), ("자몽에이드소분", 4, 6), ("딸기라떼소분", 0, 6),
    ("오미자청", 1.5, 3), ("자몽청", 0.3, 1), ("아이스컵16온스", 1, 2), ("12온스종이컵", 0.3, 2),
    ("버블티소분", 0.8, 30), ("치즈케익박스", 0, 2), ("초코케익박스", 0, 2),
]


def reorder_recommendations() -> list[dict]:
    """재고 계산 → 안전재고(적정수량) 확인 → 자동 발주 추천."""
    recs = []
    for name, cur, safe in INVENTORY:
        short = round(safe - cur, 2)
        if short > 0:  # 현재 < 적정 → 발주
            recs.append({"품목": name, "현재": cur, "적정": safe, "부족": short,
                         "발주추천": short, "긴급": cur == 0})
    return sorted(recs, key=lambda r: (-r["긴급"], -r["부족"]))


def menu_costs() -> list[dict]:
    """원가 계산 — 판매가 × 원가율 → 원가·마진."""
    out = []
    for name, (price, ratio) in MENU.items():
        cost = round(price * ratio)
        out.append({"메뉴": name, "판매가": price, "원가율": round(ratio * 100, 1),
                    "원가": cost, "마진": price - cost})
    return sorted(out, key=lambda m: m["원가율"], reverse=True)


def daily_report() -> dict:
    recs = reorder_recommendations()
    costs = menu_costs()
    avg_ratio = round(sum(m["원가율"] for m in costs) / len(costs), 1)
    report = {
        "date": datetime.date.today().isoformat(),
        "store": "지브릭커피 본점",
        "재고부족_건수": len(recs),
        "긴급발주_건수": sum(1 for r in recs if r["긴급"]),
        "발주추천": recs,
        "평균원가율": avg_ratio,
        "고원가_메뉴": [m for m in costs if m["원가율"] >= 25][:5],
        "메뉴원가": costs,
        "옵션단가": OPTIONS,
        "원재료그룹수": sum(INGREDIENT_GROUPS.values()),
    }
    (OUT / "erp_daily_report.json").write_text(
        json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
    return report


def _pos_summary() -> dict:
    """POS 분석(pos_import 산출물)이 있으면 실매출/판매순위를 대시보드에 연결."""
    p = OUT / "pos_analysis.json"
    if not p.exists():
        return {}
    d = json.loads(p.read_text(encoding="utf-8"))
    return {
        "매출_순액": d.get("총매출_순액"),
        "판매수량": d.get("총판매수량"),
        "할인": d.get("총할인"),
        "판매순위_TOP3": [f"{x['메뉴']} {int(x['수량'])}개" for x in d.get("판매순위_수량", [])[:3]],
        "기간": d.get("period"),
    }


def dashboard() -> dict:
    """CEO Dashboard — 매출·판매순위·원가율·재고부족·발주추천·오늘의 KPI."""
    r = daily_report()
    dash = {
        "오늘": r["date"],
        "매출_POS": _pos_summary(),
        "재고부족": r["재고부족_건수"],
        "긴급발주": r["긴급발주_건수"],
        "발주추천_TOP3": [f"{x['품목']} {x['발주추천']}개" for x in r["발주추천"][:3]],
        "평균원가율": f"{r['평균원가율']}%",
        "고원가_경고": [f"{m['메뉴']} {m['원가율']}%" for m in r["고원가_메뉴"][:3]],
        "메뉴수": len(r["메뉴원가"]),
    }
    (OUT / "erp_dashboard.json").write_text(
        json.dumps(dash, ensure_ascii=True, indent=2), encoding="utf-8")
    return dash


if __name__ == "__main__":
    print(json.dumps(dashboard(), ensure_ascii=True, indent=2))
