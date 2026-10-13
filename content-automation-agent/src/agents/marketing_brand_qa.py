"""
Brand QA — 브랜드 규칙·사실 검증 에이전트.

Input:  brand: str, content: str, check_type: "copy"|"script"|"caption"
Process: 브랜드 설정의 금지 패턴을 regex로 검사 (LLM 불필요 — dry-run에서도 동작).
         ① 금지 문자열 포함 여부 ② 금지 regex 패턴 매칭 ③ 법정고지 필요 여부 확인.
Output: {passed, violations, suggestions, checked_rules, requires_legal_notice}

규칙: 위반이 하나라도 있으면 passed=False. QA가 False이면 Publishing Coordinator는
      게시 준비 문서를 생성하지 않는다.
"""
from __future__ import annotations
import re
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from marketing_llm import load_brand


def _check_legal_notice(content: str, brand_cfg: dict) -> bool:
    """법정고지가 필요한 키워드가 있는데 고지 문구가 없으면 True(위반) 반환."""
    legal_notice = brand_cfg.get("legal_notice")
    if not legal_notice:
        return False
    required_when = brand_cfg.get("legal_notice_required_when", [])
    triggers = [kw for kw in required_when if kw in content]
    if not triggers:
        return False
    # 법정고지 핵심 구절이 포함되어 있는지 확인
    return "정보공개서 기준" not in content and "실제 창업 내용과 차이" not in content


def run(brand: str, content: str, check_type: str = "copy") -> dict:
    brand_cfg = load_brand(brand)
    violations: list[str] = []
    suggestions: list[str] = []
    checked_rules: list[str] = []

    # 1. 금지 문자열 검사
    for claim in brand_cfg.get("prohibited_claims", []):
        checked_rules.append(f"금지_문자열: {claim}")
        if claim in content:
            violations.append(f"금지된 표현 포함: '{claim}'")
            suggestions.append(f"'{claim}' 제거 또는 DATA_MISSING 처리")

    # 2. 금지 regex 패턴 검사
    for pattern in brand_cfg.get("prohibited_patterns_regex", []):
        checked_rules.append(f"금지_패턴: {pattern}")
        try:
            if re.search(pattern, content):
                violations.append(f"금지 패턴 감지: {pattern}")
                suggestions.append(f"패턴 '{pattern}'에 해당하는 수치/표현 제거")
        except re.error:
            pass

    # 3. 법정고지 검사
    checked_rules.append("법정고지_필요_여부")
    if _check_legal_notice(content, brand_cfg):
        violations.append("법정고지 키워드 있음에도 고지 문구 누락")
        notice = brand_cfg.get("legal_notice", "")
        suggestions.append(f"콘텐츠 끝에 법정고지 추가: \"{notice}\"")

    # 4. 브랜드명 표기 검사 (GBRICK만)
    if brand == "gbrick":
        checked_rules.append("브랜드명_표기")
        if "G.BRICK" in content or "지브릭 커피" in content:
            violations.append("브랜드명 표기 오류 (G.BRICK → GBRICK Coffee, 지브릭 커피 → 지브릭커피)")
            suggestions.append("브랜드명을 'GBRICK Coffee' 또는 '지브릭커피'로 수정")

    requires_legal_notice = bool(brand_cfg.get("legal_notice")) and any(
        kw in content for kw in brand_cfg.get("legal_notice_required_when", [])
    )

    return {
        "passed": len(violations) == 0,
        "violations": violations,
        "suggestions": suggestions,
        "checked_rules": checked_rules,
        "requires_legal_notice": requires_legal_notice,
        "check_type": check_type,
        "brand": brand,
    }
