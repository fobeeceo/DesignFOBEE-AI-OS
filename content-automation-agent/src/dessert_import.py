"""
dessert_import.py — 디저트 단가표 Excel 임포트 (Phase 3, 원가율 완성).
지브릭커피_디저트단가표: 품목명·매입가·입수·원가(개당)·판매가·순액·원가율.
→ output/dessert_menu.json (erp_engine 이 읽어 디저트 원가율 반영).

사용: python dessert_import.py "<디저트단가표.xlsx>"
컬럼: 0 품목명 · 7 원가 · 8 판매가 · 9 순액 · 10 원가율
"""
from __future__ import annotations
import sys
import json
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "output"
OUT.mkdir(exist_ok=True)


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def parse(path: str) -> list[dict]:
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    items = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue  # 헤더
        name = row[0]
        cost = _num(row[7]) if len(row) > 7 else None
        price = _num(row[8]) if len(row) > 8 else None
        ratio = _num(row[10]) if len(row) > 10 else None
        if not name or price is None or price <= 0:
            continue
        items.append({
            "name": str(name).strip(),
            "cost": int(cost) if cost is not None else None,
            "price": int(price),
            "ratio": round(ratio, 1) if ratio is not None else (
                round(cost / price * 100, 1) if cost else None),
        })
    return items


def run(path: str) -> dict:
    items = parse(path)
    prices = [i["price"] for i in items]
    ratios = [i["ratio"] for i in items if i["ratio"] is not None]
    report = {
        "source": "지브릭커피 디저트단가표",
        "count": len(items),
        "avgPrice": round(sum(prices) / len(prices)) if prices else 0,
        "avgRatio": round(sum(ratios) / len(ratios), 1) if ratios else 0,
        "items": items,
    }
    (OUT / "dessert_menu.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else ""
    if not path:
        print("usage: python dessert_import.py <디저트단가표.xlsx>")
        sys.exit(1)
    r = run(path)
    print(json.dumps({"count": r["count"], "avgPrice": r["avgPrice"], "avgRatio": r["avgRatio"]},
                     ensure_ascii=True, indent=2))
