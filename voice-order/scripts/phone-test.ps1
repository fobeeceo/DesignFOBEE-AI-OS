# GBRICK 음성 주문 — 휴대폰 시험 한 줄 설치·실행 (Windows PowerShell)
# 실행: irm https://raw.githubusercontent.com/fobeeceo/DesignFOBEE-AI-OS/feature/gbrick-voice-order-store/voice-order/scripts/phone-test.ps1 | iex
# 하는 일: 최신 버전 받기 → 압축 풀기 → 예전 폴더는 이름만 바꿔 보관(삭제 안 함) → share.bat 실행 (항상 TEST 연습 주문)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue' # 진행 막대가 다운로드를 느리게 해서 끈다

$branch = 'feature/gbrick-voice-order-store'
$zipUrl = "https://github.com/fobeeceo/DesignFOBEE-AI-OS/archive/refs/heads/$branch.zip"
$base = Join-Path $env:USERPROFILE 'GBRICK'
$dest = Join-Path $base 'voice-order-app'
$zip = Join-Path $base 'download.zip'
$tmp = Join-Path $base 'download-tmp'

Write-Host ''
Write-Host ' GBRICK 음성 주문 - 휴대폰 시험 준비 (TEST 연습 주문)' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ' [안내] Node.js가 없습니다. https://nodejs.org 에서 LTS를 설치한 뒤 PowerShell을 새로 열고 다시 실행하세요.' -ForegroundColor Yellow
  return
}
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue) -and -not (Test-Path 'C:\Program Files (x86)\cloudflared\cloudflared.exe') -and -not (Test-Path 'C:\Program Files\cloudflared\cloudflared.exe')) {
  Write-Host ' [안내] 인터넷 공유 프로그램이 없습니다. 먼저 실행하세요:' -ForegroundColor Yellow
  Write-Host '   winget install --id Cloudflare.cloudflared --source winget'
  return
}
if (-not [Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User')) {
  Write-Host ' [참고] GEMINI_API_KEY가 없어 AI 바리스타는 꺼진 채로 시작합니다 (일반 음성 주문은 됩니다).' -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force -Path $base | Out-Null
Write-Host ' 1/3 최신 버전 받는 중... (1~3분)'
Invoke-WebRequest -UseBasicParsing -Uri $zipUrl -OutFile $zip

Write-Host ' 2/3 압축 푸는 중...'
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp } # 이 스크립트가 만든 임시 폴더만 지운다
Expand-Archive -Path $zip -DestinationPath $tmp
$inner = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
if (-not (Test-Path (Join-Path $inner.FullName 'voice-order\share.bat'))) { throw '받은 파일에 voice-order\share.bat 이 없습니다.' }
if (Test-Path $dest) {
  $backup = "$dest-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Rename-Item -Path $dest -NewName (Split-Path $backup -Leaf)
  Write-Host "     예전 폴더는 보관했습니다: $backup"
}
Move-Item -Path $inner.FullName -Destination $dest
Remove-Item -Recurse -Force $tmp
Remove-Item -Force $zip

$app = Join-Path $dest 'voice-order'
Write-Host ' 3/3 인터넷 공유를 새 창에서 시작합니다.'
Write-Host ''
Write-Host ' 새 검은 창에서 "★ 휴대폰 바리스타 주문 : https://..." 주소를 휴대폰으로 보내세요.' -ForegroundColor Green
Write-Host " 다음부터는 이 파일만 두 번 누르면 됩니다: $app\share.bat"
Start-Process -FilePath (Join-Path $app 'share.bat') -WorkingDirectory $app
