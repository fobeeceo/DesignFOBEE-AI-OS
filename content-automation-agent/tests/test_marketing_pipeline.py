"""
test_marketing_pipeline.py — 마케팅 파이프라인 테스트 (Phase M1).

테스트 대상:
  1. Brand QA — 금지 수치 포함 시 passed=False
  2. Brand QA — 정상 콘텐츠 passed=True
  3. 브랜드 분리 — gbrick 설정이 designfobee와 혼재하지 않음
  4. Dry-run — GEMINI_API_KEY 없어도 파이프라인 완료 (available:False)
  5. Publishing Coordinator — QA 실패 시 게시 준비 차단
  6. marketing_lead.run() — 전체 파이프라인 dry-run, 12개 출력 키 존재 확인
  7. 누락 데이터 — 트렌드 소스 없으면 DATA_MISSING 처리

모든 테스트는 GEMINI_API_KEY 없이(dry-run) 실행한다.
실제 SNS 게시·외부 API 호출 없음.
"""
from __future__ import annotations
import os
import sys
import pathlib
import json
import importlib

# 환경 — 테스트 중 GEMINI_API_KEY를 강제로 비움 (dry-run 보장)
os.environ.pop("GEMINI_API_KEY", None)

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

import pytest


# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────

@pytest.fixture
def gbrick_cfg():
    from marketing_llm import load_brand
    return load_brand("gbrick")


@pytest.fixture
def designfobee_cfg():
    from marketing_llm import load_brand
    return load_brand("designfobee")


# ──────────────────────────────────────────────
# 1. Brand QA — 금지 수치 포함 시 passed=False
# ──────────────────────────────────────────────

class TestBrandQAReject:
    def test_store_count_rejected(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "저희 지브릭커피는 7개 매장을 운영 중입니다.")
        assert result["passed"] is False
        assert len(result["violations"]) > 0

    def test_closure_zero_rejected(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "3년 폐점 0건의 브랜드를 만나보세요.")
        assert result["passed"] is False, "폐점 0건 표현은 금지 패턴 위반이어야 함"

    def test_digit_stores_pattern_rejected(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "전국 12개 매장 운영 중!")
        assert result["passed"] is False, "숫자+개+매장 패턴은 금지"

    def test_average_revenue_rejected(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "평균 매출액은 월 500만원입니다.")
        assert result["passed"] is False

    def test_brand_name_typo_rejected(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "G.BRICK Coffee에 오신 것을 환영합니다.")
        assert result["passed"] is False, "G.BRICK은 오타 — 브랜드명 위반"

    def test_wrong_brand_spacing_rejected(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "지브릭 커피의 공간을 경험하세요.")
        assert result["passed"] is False, "'지브릭 커피'(띄어쓰기)는 금지"

    def test_designfobee_prohibited_terms(self):
        from agents.marketing_brand_qa import run
        result = run("designfobee", "업계 최저가 인테리어를 보장합니다.")
        assert result["passed"] is False, "최저가 보장 표현 금지"

    def test_script_check_type_works(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "가맹점 수 10개 돌파!", check_type="script")
        assert result["passed"] is False
        assert result["check_type"] == "script"


# ──────────────────────────────────────────────
# 2. Brand QA — 정상 콘텐츠 passed=True
# ──────────────────────────────────────────────

class TestBrandQAPass:
    def test_clean_gbrick_copy_passes(self):
        from agents.marketing_brand_qa import run
        # 법정고지 트리거(창업비용/가맹/프랜차이즈/로열티) 제외한 순수 브랜드 콘텐츠
        content = "지브릭커피 은평본점에서 공간을 경험하세요. 좋은 공간이 하루를 바꿉니다."
        result = run("gbrick", content)
        assert result["passed"] is True, f"위반 항목: {result['violations']}"

    def test_gbrick_franchise_content_requires_legal_notice(self):
        from agents.marketing_brand_qa import run
        # 창업비용 언급 시 법정고지 없으면 QA 실패 — 의도된 동작
        content = "총 창업비용 약 8,636만원(66㎡ 기준)으로 시작하는 카페 창업."
        result = run("gbrick", content)
        assert result["passed"] is False, "법정고지 없는 창업비용 콘텐츠는 QA 실패해야 함"
        assert result["requires_legal_notice"] is True

    def test_clean_gbrick_no_numbers_passes(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "GBRICK Coffee는 공간과 커피를 연결하는 브랜드입니다.")
        assert result["passed"] is True

    def test_clean_designfobee_copy_passes(self):
        from agents.marketing_brand_qa import run
        result = run("designfobee", "디자인포비는 26년 공간디자인 전문기업입니다. 교회·상업공간·주거 설계.")
        assert result["passed"] is True, f"위반 항목: {result['violations']}"

    def test_legal_notice_check_irrelevant_content(self):
        from agents.marketing_brand_qa import run
        result = run("gbrick", "좋은 공간에서 하루를 시작하세요.")
        assert result["requires_legal_notice"] is False


# ──────────────────────────────────────────────
# 3. 브랜드 분리
# ──────────────────────────────────────────────

class TestBrandSeparation:
    def test_gbrick_brand_id(self, gbrick_cfg):
        assert gbrick_cfg["brand_id"] == "gbrick"

    def test_designfobee_brand_id(self, designfobee_cfg):
        assert designfobee_cfg["brand_id"] == "designfobee"

    def test_different_ssot_facts(self, gbrick_cfg, designfobee_cfg):
        gbrick_facts = set(gbrick_cfg.get("ssot_facts", []))
        df_facts = set(designfobee_cfg.get("ssot_facts", []))
        assert gbrick_facts != df_facts, "두 브랜드의 SSOT 팩트가 동일하면 안 됨"

    def test_different_kpi(self, gbrick_cfg, designfobee_cfg):
        assert gbrick_cfg.get("kpi_primary") != designfobee_cfg.get("kpi_primary")

    def test_gbrick_prohibited_has_store_count(self, gbrick_cfg):
        prohibited = gbrick_cfg.get("prohibited_claims", [])
        assert any("매장 수" in c or "가맹점 수" in c for c in prohibited)

    def test_audience_output_has_brand_key(self):
        from agents.marketing_audience import run
        result = run("gbrick", {})
        assert result.get("brand") == "gbrick"

    def test_audience_gbrick_not_designfobee(self):
        from agents.marketing_audience import run
        gbrick_result = run("gbrick", {})
        df_result = run("designfobee", {})
        assert gbrick_result.get("brand") != df_result.get("brand")


# ──────────────────────────────────────────────
# 4. Dry-run — API key 없어도 파이프라인 완료
# ──────────────────────────────────────────────

class TestDryRun:
    def test_llm_returns_stub_without_key(self):
        from marketing_llm import call_llm
        text, live = call_llm("TestRole", "테스트 프롬프트")
        assert live is False
        assert "DRY-RUN" in text

    def test_parse_json_safe_fallback(self):
        from marketing_llm import parse_json_safe
        result = parse_json_safe("invalid json {{", {"default": True})
        assert result == {"default": True}

    def test_audience_dry_run_available_false(self):
        from agents.marketing_audience import run
        result = run("gbrick", {"키워드": ["카페", "공간"]})
        assert result.get("available") is False

    def test_channel_dry_run_available_false(self):
        from agents.marketing_channel import run
        result = run("gbrick", {}, {})
        assert result.get("available") is False

    def test_planner_dry_run_available_false(self):
        from agents.marketing_planner import run
        result = run("gbrick", "은평본점 공간 이야기", {}, {}, {})
        assert result.get("available") is False

    def test_planner_dry_run_has_fallback_card(self):
        from agents.marketing_planner import run
        result = run("gbrick", "은평본점 공간 이야기", {}, {}, {})
        cards = result.get("content_cards", [])
        assert len(cards) >= 1

    def test_video_dry_run_available_false(self):
        from agents.marketing_video import run
        card = {"title": "은평본점", "hook_sentence": "테스트", "structure": [], "cta": "", "platform": "tiktok"}
        result = run("gbrick", card, {})
        assert result.get("available") is False

    def test_video_dry_run_has_scenes(self):
        from agents.marketing_video import run
        card = {"title": "공간 이야기", "hook_sentence": "", "structure": [], "cta": "", "platform": "tiktok"}
        result = run("gbrick", card, {})
        assert "scenes" in result
        assert isinstance(result["scenes"], list)
        assert len(result["scenes"]) >= 1


# ──────────────────────────────────────────────
# 5. Publishing Coordinator — QA 실패 시 차단
# ──────────────────────────────────────────────

class TestPublishingBlock:
    def test_blocked_when_qa_fails(self):
        from agents.marketing_publisher_prep import run
        qa_failed = {"passed": False, "violations": ["금지된 표현: '7개 매장'"]}
        result = run("gbrick", {}, {}, {}, qa_failed)
        assert result.get("platforms") == {}
        assert result.get("blocked_reason") is not None
        assert result.get("available") is False

    def test_blocked_reason_contains_violation(self):
        from agents.marketing_publisher_prep import run
        violations = ["금지 표현 포함: '3년 폐점 0건'"]
        qa_failed = {"passed": False, "violations": violations}
        result = run("gbrick", {}, {}, {}, qa_failed)
        assert "위반항목" in result.get("blocked_reason", "")

    def test_passes_when_qa_ok_dryrun(self):
        """QA 통과 시 게시 준비 시도 (dry-run: available=False지만 차단 아님)."""
        from agents.marketing_publisher_prep import run
        qa_ok = {"passed": True, "violations": []}
        video = {"hook": "테스트 후킹", "full_script": "테스트 대본"}
        card = {"title": "테스트", "cta": "방문하세요"}
        result = run("gbrick", video, {}, card, qa_ok)
        assert result.get("blocked_reason") is None
        # dry-run이므로 DATA_MISSING이지만 플랫폼 구조는 존재
        assert "tiktok" in result.get("platforms", {})


# ──────────────────────────────────────────────
# 6. marketing_lead.run() 전체 파이프라인 dry-run
# ──────────────────────────────────────────────

class TestMarketingLeadEndToEnd:
    @pytest.fixture(scope="class")
    def lead_result(self):
        from marketing_lead import run
        return run(brand="gbrick", topic="은평본점 공간 이야기")

    _REQUIRED_KEYS = [
        "trend", "audience", "channel_strategy", "plan", "video",
        "brand_qa", "publishing", "kpi",
        "report_markdown", "all_available", "generated_at",
        "output_files",
    ]

    def test_all_required_keys_present(self, lead_result):
        for key in self._REQUIRED_KEYS:
            assert key in lead_result, f"누락된 키: {key}"

    def test_pipeline_completes_without_api_key(self, lead_result):
        # API key 없어도 파이프라인이 예외 없이 완료되어야 함
        assert lead_result is not None

    def test_all_available_false_in_dryrun(self, lead_result):
        assert lead_result["all_available"] is False

    def test_report_markdown_is_string(self, lead_result):
        assert isinstance(lead_result["report_markdown"], str)
        assert len(lead_result["report_markdown"]) > 50

    def test_report_markdown_has_sections(self, lead_result):
        md = lead_result["report_markdown"]
        assert "마케팅 AI 브리핑" in md
        assert "트렌드" in md
        assert "KPI" in md

    def test_kpi_has_required_fields(self, lead_result):
        kpi = lead_result["kpi"]
        assert "primary_kpis" in kpi
        assert "channel_metrics" in kpi
        assert "measurement_window_days" in kpi

    def test_brand_in_result(self, lead_result):
        assert lead_result.get("brand") == "gbrick"

    def test_output_files_written(self, lead_result):
        pkg = pathlib.Path(lead_result["output_files"]["package"])
        brief = pathlib.Path(lead_result["output_files"]["brief"])
        assert pkg.exists(), f"패키지 파일 없음: {pkg}"
        assert brief.exists(), f"브리핑 파일 없음: {brief}"

    def test_output_package_valid_json(self, lead_result):
        pkg_path = pathlib.Path(lead_result["output_files"]["package"])
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        assert pkg.get("brand") == "gbrick"

    def test_designfobee_separate_run(self):
        from marketing_lead import run
        result = run(brand="designfobee", topic="강남 오피스 리모델링")
        assert result.get("brand") == "designfobee"
        # gbrick 출력 디렉토리와 다른 디렉토리에 저장
        pkg_path = result["output_files"]["package"]
        assert "designfobee" in pkg_path


# ──────────────────────────────────────────────
# 7. 누락 데이터 — 트렌드 소스 없을 때 DATA_MISSING
# ──────────────────────────────────────────────

class TestMissingData:
    def test_empty_trend_sources_returns_unavailable(self):
        from marketing_lead import run
        # 존재하지 않는 브랜드 → 소스 파일 없음 → trend.available=False
        result = run(brand="nonexistent_brand_test", topic="테스트 주제")
        assert result["trend"].get("available") is False

    def test_trend_missing_gives_data_missing_keywords(self):
        from marketing_lead import run
        result = run(brand="nonexistent_brand_test", topic="테스트 주제")
        keywords = result["trend"].get("키워드", [])
        # 소스 없음 → 빈 키워드 목록 또는 DATA_MISSING
        assert keywords == [] or keywords == ["DATA_MISSING"]

    def test_planner_with_empty_trend_has_fallback(self):
        from agents.marketing_planner import run
        result = run("gbrick", "테스트", {"available": False, "키워드": []}, {}, {})
        cards = result.get("content_cards", [])
        assert len(cards) >= 1

    def test_report_warns_on_missing_trend(self):
        from marketing_lead import run
        result = run(brand="nonexistent_brand_test", topic="테스트 주제")
        md = result["report_markdown"]
        # 트렌드 데이터 없으면 경고가 리포트에 포함되어야 함
        assert "DATA_MISSING" in md or "MISSING" in md or "없음" in md or "⚠️" in md
