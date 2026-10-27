@echo off
chcp 65001 > nul
cd /d "%~dp0"
if not exist package.json (
  echo.
  echo  [안내] 압축 파일 안에서 바로 실행하셨습니다.
  echo  zip 파일을 오른쪽 클릭 - 압축 풀기 를 먼저 한 뒤,
  echo  풀린 폴더의 voice-order 안에서 이 파일을 다시 실행해 주세요.
  echo.
  pause
  exit /b 1
)
echo GBRICK 음성 주문 - 인터넷 공유를 시작합니다...
call npm run share
pause
