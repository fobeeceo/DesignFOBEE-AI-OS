"""
pos_import.py — POS 마감 Excel(상품별 판매) 임포트·분석 (Phase 3 Priority 2).
판매 메뉴/수량/매출/옵션/할인을 파싱 → 판매순위·매출·카테고리·가중원가율 → output/pos_analysis.json.
ERP(erp_engine)와 연결 — 실판매 기반 대시보드/환류. 기존 구조 무변경(src에 연결만).

사용: python pos_import.py "<POS엑셀경로>"
의존성: openpyxl.
"""
from __future__ import annotations
import sys
import json
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "output"
OUT.mkdir(exist_ok=True)

# 컬럼 인덱스 (POS clsProd 포맷): No,대분류,상품코드,-,-,상품명,수량,총매출,할인,판매금액
COL = {"no": 0, "category": 1, "code": 2, "name": 5, "qty": 6, "gross": 7, "disc": 8, "net": 9}


def _num(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def parse(path: str) -> dict:
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    items = []
    period = ""
    for row in ws.iter_rows(values_only=True):
        c0 = str(row[COL["no"]]).strip() if row[COL["no"]] is not None else ""
        c1 = str(row[COL["category"]]).strip() if row[COL["category"]] is not None else ""
        name = row[COL["name"]]
        if c1.startswith("* 기간") or c1.startswith("*") or (isinstance(row[0], str) and "기간" in str(row[0])):
            if "~" in str(row[0]):
                period = str(row[0]).split(":", 1)[-1].strip()
        # 상품 행 = No가 숫자 + 상품명 존재 (소계/합계/헤더 제외)
        if c0.isdigit() and name and c1 and not c1.startswith("소계"):
            items.append({
                "category": c1, "code": str(row[COL["code"]] or ""), "name": str(name),
                "qty": _num(row[COL["qty"]]), "gross": _num(row[COL["gross"]]),
                "discount": _num(row[COL["disc"]]), "net": _num(row[COL["net"]]),
            })
    return {"period": period, "items": items}


def analyze(parsed: dict) -> dict:
    items = parsed["items"]
    total_qty = round(sum(i["qty"] for i in items), 1)
    total_net = round(sum(i["net"] for i in items))
    total_disc = round(sum(i["discount"] for i in items))

    by_qty = sorted(items, key=lambda i: i["qty"], reverse=True)[:10]
    by_rev = sorted(items, key=lambda i: i["net"], reverse=True)[:10]

    cat = {}
    for i in items:
        c = cat.setdefault(i["category"], {"qty": 0.0, "net": 0.0})
        c["qty"] += i["qty"]
        c["net"] += i["net"]
    cat_sorted = sorted(({"category": k, "qty": round(v["qty"], 1), "net": round(v["net"])}
                         for k, v in cat.items()), key=lambda x: x["net"], reverse=True)

    # 이름별 전체 판매 집계(TOP10 아닌 전체) — menu_engineering()이 저판매 메뉴(단종후보)를 찾으려면 필요
    by_name: dict[str, dict] = {}
    for i in items:
        e = by_name.setdefault(i["name"], {"qty": 0.0, "net": 0})
        e["qty"] += i["qty"]
        e["net"] += round(i["net"])
    all_sales = sorted(
        ({"메뉴": k, "수량": round(v["qty"], 1), "매출": v["net"]} for k, v in by_name.items()),
        key=lambda x: -x["수량"],
    )

    report = {
        "source": "POS clsProd",
        "period": parsed["period"],
        "상품수": len(items),
        "총판매수량": total_qty,
        "총매출_순액": total_net,
        "총할인": total_disc,
        "판매순위_수량": [{"메뉴": i["name"], "수량": i["qty"], "매출": round(i["net"])} for i in by_qty],
        "판매순위_매출": [{"메뉴": i["name"], "매출": round(i["net"]), "수량": i["qty"]} for i in by_rev],
        "카테고리별": cat_sorted,
        "전체_판매": all_sales,
    }
    (OUT / "pos_analysis.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else ""
    if not path:
        print("usage: python pos_import.py <POS.xlsx>")
        sys.exit(1)
    rep = analyze(parse(path))
    print(json.dumps({"period": rep["period"], "상품수": rep["상품수"],
                      "총판매수량": rep["총판매수량"], "총매출_순액": rep["총매출_순액"],
                      "총할인": rep["총할인"],
                      "TOP3_수량": [x["메뉴"] for x in rep["판매순위_수량"][:3]]},
                     ensure_ascii=True, indent=2))
