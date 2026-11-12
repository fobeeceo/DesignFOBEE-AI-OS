@echo off
chcp 65001 > nul
title GBRICK Coffee POS 설치

echo.
echo  =============================================
echo    GBRICK Coffee POS 설치 프로그램 v1.0
echo  =============================================
echo.

:: ── 설정 ──────────────────────────────────────────
set "POS_URL=https://design-fobee-ai-os.vercel.app/gbrick/admin/gbrick-esp-001"
set "APP_NAME=GBRICK POS"
set "DESKTOP=%USERPROFILE%\Desktop"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
:: ──────────────────────────────────────────────────

echo  [1/3] 브라우저 확인 중...

:: Chrome 경로 탐색
set "BROWSER_PATH="
for %%p in (
    "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
    if exist %%p (
        set "BROWSER_PATH=%%~p"
        set "BROWSER_NAME=Google Chrome"
        goto :found_browser
    )
)

:: Edge 대체
for %%p in (
    "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
    if exist %%p (
        set "BROWSER_PATH=%%~p"
        set "BROWSER_NAME=Microsoft Edge"
        goto :found_browser
    )
)

echo.
echo  [오류] Chrome 또는 Edge가 없습니다.
echo  Chrome 설치 후 다시 실행하세요.
echo  다운로드: https://www.google.com/chrome
echo.
pause
exit /b 1

:found_browser
echo         %BROWSER_NAME% 확인됨
echo.

:: ── 바로가기 인수 ────────────────────────────────
set "ARGS=--kiosk --app=%POS_URL% --disable-infobars --no-first-run --disable-translate --no-default-browser-check --disable-pinch --overscroll-history-navigation=0"

echo  [2/3] 바탕화면 바로가기 생성 중...

:: VBScript로 바로가기 생성 (아이콘 포함)
set "VBS=%TEMP%\gbrick_shortcut.vbs"
(
    echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
    echo ' 바탕화면 바로가기
    echo sLinkFile = "%DESKTOP%\%APP_NAME%.lnk"
    echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
    echo oLink.TargetPath = "%BROWSER_PATH%"
    echo oLink.Arguments = "%ARGS%"
    echo oLink.Description = "GBRICK Coffee 매장 POS"
    echo oLink.WorkingDirectory = "%USERPROFILE%"
    echo oLink.WindowStyle = 3
    echo oLink.Save
) > "%VBS%"
cscript //nologo "%VBS%"
del "%VBS%" 2>nul

if exist "%DESKTOP%\%APP_NAME%.lnk" (
    echo         바탕화면 바로가기 생성 완료
) else (
    echo  [경고] 바로가기 생성 실패 - 수동으로 만들어 주세요
)

echo.
echo  [3/3] 시작 프로그램 등록 여부 확인...
echo.
echo  ┌──────────────────────────────────────────┐
echo  │  컴퓨터 켜면 POS 자동 시작하시겠습니까?  │
echo  │  Y = 예 (권장) / N = 아니오              │
echo  └──────────────────────────────────────────┘
set /p AUTOSTART=  선택 (Y/N):

if /i "%AUTOSTART%"=="Y" (
    set "VBS2=%TEMP%\gbrick_startup.vbs"
    (
        echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
        echo sLinkFile = "%STARTUP%\%APP_NAME%.lnk"
        echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
        echo oLink.TargetPath = "%BROWSER_PATH%"
        echo oLink.Arguments = "%ARGS%"
        echo oLink.Description = "GBRICK Coffee POS 자동시작"
        echo oLink.WorkingDirectory = "%USERPROFILE%"
        echo oLink.WindowStyle = 3
        echo oLink.Save
    ) > "%VBS2%"
    cscript //nologo "%VBS2%"
    del "%VBS2%" 2>nul
    echo         자동 시작 등록 완료
) else (
    echo         자동 시작 건너뜀
)

echo.
echo  =============================================
echo    설치 완료!
echo  =============================================
echo.
echo  바탕화면 "GBRICK POS" 더블클릭으로 시작
echo.
echo  ■ POS 종료: Alt + F4
echo  ■ 주방 빌지: 주문 카드의 🖨 버튼 클릭
echo  ■ 자동 출력: 주문 탭 상단 토글 ON
echo.
echo  지금 바로 실행하시겠습니까? (Y/N)
set /p LAUNCH=  선택:
if /i "%LAUNCH%"=="Y" (
    start "" "%BROWSER_PATH%" %ARGS%
)

echo.
pause
