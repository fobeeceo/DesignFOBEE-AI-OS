@echo off
title GBRICK POS Setup

set "POS_URL=https://design-fobee-ai-os.vercel.app/gbrick/admin/gbrick-esp-001"
set "ARGS=--kiosk --app=%POS_URL% --disable-infobars --no-first-run --disable-translate --no-default-browser-check --disable-pinch --overscroll-history-navigation=0"
set "BROWSER="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe"       set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"  set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe"        set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if "%BROWSER%"=="" if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if "%BROWSER%"=="" if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"      set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if "%BROWSER%"=="" (
    echo [ERROR] Chrome or Edge not found.
    echo Please install Chrome: https://www.google.com/chrome
    pause
    exit /b 1
)

echo [OK] Browser: %BROWSER%
echo.

:: Create Desktop shortcut via PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws=New-Object -ComObject WScript.Shell;" ^
  "$sc=$ws.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\GBRICK POS.lnk');" ^
  "$sc.TargetPath='%BROWSER%';" ^
  "$sc.Arguments='%ARGS%';" ^
  "$sc.Description='GBRICK Coffee POS';" ^
  "$sc.WindowStyle=3;" ^
  "$sc.Save();" ^
  "Write-Host '[OK] Desktop shortcut created.'"

echo.

:: Ask auto-start
choice /C YN /M "Auto-start on Windows login? (Y=Yes / N=No)"
if errorlevel 2 goto :no_autostart

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws=New-Object -ComObject WScript.Shell;" ^
  "$startup=[Environment]::GetFolderPath('Startup');" ^
  "$sc=$ws.CreateShortcut($startup+'\GBRICK POS.lnk');" ^
  "$sc.TargetPath='%BROWSER%';" ^
  "$sc.Arguments='%ARGS%';" ^
  "$sc.Description='GBRICK Coffee POS';" ^
  "$sc.WindowStyle=3;" ^
  "$sc.Save();" ^
  "Write-Host '[OK] Auto-start registered.'"

:no_autostart
echo.
echo ============================================
echo   Setup complete!
echo   - Shortcut: Desktop [GBRICK POS]
echo   - Exit POS : Alt + F4
echo   - Print    : Click printer icon on order
echo ============================================
echo.

choice /C YN /M "Launch POS now? (Y=Yes / N=No)"
if errorlevel 2 goto :done

start "" "%BROWSER%" %ARGS%

:done
echo.
pause
