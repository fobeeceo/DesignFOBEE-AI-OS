"""pytest가 src/ 아래 모듈(erp_engine, discord_brief, agents.*)을 import할 수 있게 경로 추가."""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "src"))
