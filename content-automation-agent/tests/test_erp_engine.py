"""erp_engine 발주 로직 유닛 테스트 — 실제 INVENTORY/SUPPLIER_MAP 데이터를 대상으로 한
불변식(invariant) 검증. 데이터 값 자체가 바뀌어도 계산 로직이 깨지면 여기서 잡힌다."""
from erp_engine import (
    INVENTORY,
    reorder_recommendations,
    purchase_orders,
    supplier_order_totals,
    SUPPLIER_MAP,
    _DEFAULT_SUPPLIER,
)


def test_reorder_recommendations_only_includes_items_below_safety_stock():
    recs = reorder_recommendations()
    below_safe = {name for name, cur, safe in INVENTORY if cur < safe}
    assert {r["품목"] for r in recs} == below_safe


def test_reorder_recommendations_urgent_flag_means_zero_stock():
    for r in reorder_recommendations():
        assert r["긴급"] == (r["현재"] == 0)


def test_reorder_recommendations_sorted_urgent_first():
    recs = reorder_recommendations()
    urgent_flags = [r["긴급"] for r in recs]
    # 한 번 False로 내려가면 다시 True로 올라오지 않아야 정렬이 맞다.
    assert urgent_flags == sorted(urgent_flags, reverse=True)


def test_purchase_orders_ids_are_sequential_and_unique():
    orders = purchase_orders()
    ids = [o["발주ID"] for o in orders]
    assert len(ids) == len(set(ids))


def test_purchase_orders_estimated_cost_only_when_price_known():
    for o in purchase_orders():
        if o["공급단가"] is None:
            assert o["예상금액"] is None
        else:
            assert o["예상금액"] == round(o["공급단가"] * o["발주추천수량"])


def test_purchase_orders_supplier_falls_back_to_default_for_unmapped_items():
    mapped_items = set(SUPPLIER_MAP.keys())
    for o in purchase_orders():
        if o["품목"] not in mapped_items:
            assert o["공급처"] == _DEFAULT_SUPPLIER["거래처"]


def test_supplier_order_totals_item_counts_match_purchase_orders():
    orders = purchase_orders()
    totals = {t["거래처"]: t["품목수"] for t in supplier_order_totals()}
    expected: dict[str, int] = {}
    for o in orders:
        expected[o["공급처"]] = expected.get(o["공급처"], 0) + 1
    assert totals == expected


def test_supplier_order_totals_marks_unknown_cost_honestly():
    for t in supplier_order_totals():
        if t["예상금액합계"] is None:
            assert t["비고"] == "확인불가(단가 미확정)"
        else:
            assert t["비고"] is None
