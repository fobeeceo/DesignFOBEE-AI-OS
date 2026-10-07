@echo off
chcp 65001 > nul
cd /d %~dp0
echo.
echo  GBRICK 본점 주문 - 이 컴퓨터 한 대로 시험합니다 [TEST 연습 모드]
echo  실제 주문 / 결제 / POS 와 연결되지 않습니다.
echo.
where node > nul 2> nul
if errorlevel 1 goto nonode

rem 다른 설정이 남아 있어도 이 파일은 항상 TEST 로만 켠다
set VOICE_ORDER_MODE=test
start "GBRICK 주문 서버 - 이 창을 닫으면 멈춥니다" cmd /k node server.mjs

set /a tries=0
:wait
curl.exe -s -o nul http://localhost:3100/api/store/GBRICK_MAIN/health
if not errorlevel 1 goto open
set /a tries+=1
if %tries% geq 30 goto fail
timeout /t 1 /nobreak > nul
goto wait

:open
start "" http://localhost:3100/counter/GBRICK_MAIN
timeout /t 1 /nobreak > nul
start "" http://localhost:3100/store/GBRICK_MAIN
echo  브라우저에 두 화면이 열렸습니다.
echo    - 손님 화면 : http://localhost:3100/store/GBRICK_MAIN
echo    - 카운터    : http://localhost:3100/counter/GBRICK_MAIN
echo  마이크가 없으면 손님 화면의 '텍스트로 테스트'를 누르세요.
echo  끝내려면 'GBRICK 주문 서버' 창을 닫으세요.
echo.
pause
exit /b 0

:nonode
echo  [안내] Node.js 가 없습니다. https://nodejs.org 에서 LTS 를 설치한 뒤 다시 실행하세요.
pause
exit /b 1

:fail
echo  [안내] 30초 안에 서버가 켜지지 않았습니다. 'GBRICK 주문 서버' 창의 메시지를 사진으로 보내주세요.
pause
exit /b 1
