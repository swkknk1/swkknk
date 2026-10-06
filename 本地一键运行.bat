@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo   正在启动【存货出清集市】本地服务...
echo ======================================================
echo.
echo 💻 电脑本机浏览器访问:   http://localhost:3000
echo 📱 同Wi-Fi手机浏览器访问: http://192.168.1.46:3000
echo.
echo 提示：
echo 1. 确保手机和电脑连接的是同一个 Wi-Fi 网络；
echo 2. 手机打开自带浏览器（Safari / Chrome）输入上方网址；
echo 3. 关闭此黑框窗口即可停止本地服务。
echo ======================================================
echo.

start http://localhost:3000
npm run dev

pause
