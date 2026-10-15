@echo off
chcp 65001 > nul
cd /d %~dp0
echo GBRICK 음성 주문 - 인터넷 공유를 시작합니다...
call npm run share
pause
