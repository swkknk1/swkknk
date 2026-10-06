@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo   正在为 Windows 防火墙放行 3000 端口...
echo ======================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 正在请求管理员权限，请在弹窗中点击【是】...
    powershell -Command "Start-Process cmd -ArgumentList '/c chcp 65001 >nul & netsh advfirewall firewall add rule name=\"Node_Port_3000\" dir=in action=allow protocol=TCP localport=3000 & echo. & echo ====================================================== & echo  【放行成功！】手机现在可以正常访问 http://192.168.1.46:3000 了 & echo ====================================================== & pause' -Verb RunAs"
    exit /b
)

netsh advfirewall firewall add rule name="Node_Port_3000" dir=in action=allow protocol=TCP localport=3000
echo.
echo ======================================================
echo   【放行成功！】手机现在可以正常访问 http://192.168.1.46:3000 了
echo ======================================================
pause
