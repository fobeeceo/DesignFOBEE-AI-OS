"""
GBRICK AI HQ Agent 모음 (업무지시서 v1.1 Priority 5).
모든 Agent는 동일한 형태를 따른다: 모듈 docstring에 Input/Process/Output을 명시하고,
`run(...)` 함수 하나로 Process+Output을 수행한다(과도한 클래스/프레임워크 없이 — 단순함 우선).
외부 데이터(날씨·뉴스·정부지원사업)가 필요한 Agent는 스스로 조회하지 않는다 — 이 코드베이스에
그 API 자격증명이 없기 때문. 호출자(WebSearch를 가진 Claude Code 세션)가 조회한 결과를
Input으로 넘기고, Agent는 그것을 정리(Process)해 Output만 만든다. 추측 데이터 생성 금지.
"""
