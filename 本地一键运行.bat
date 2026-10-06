@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo   正在启动【存货出清集市】本地服务...
echo ======================================================
echo.
echo 浏览器访问: http://localhost:3000
echo 提示：关闭此黑框窗口即可停止本地服务。
echo.

start http://localhost:3000
npm run dev

pause
