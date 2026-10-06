@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo   正在关闭 3000 端口并恢复防火墙拦截...
echo ======================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 正在请求管理员权限，请在弹窗中点击【是】...
    powershell -Command "Start-Process cmd -ArgumentList '/c chcp 65001 >nul & netsh advfirewall firewall delete rule name=\"Node_Port_3000\" & echo. & echo ====================================================== & echo  【已成功关闭！】防火墙已恢复拦截，局域网设备无法再访问 3000 端口 & echo ====================================================== & pause' -Verb RunAs"
    exit /b
)

netsh advfirewall firewall delete rule name="Node_Port_3000"
echo.
echo ======================================================
echo   【已成功关闭！】防火墙已恢复拦截，局域网设备无法再访问 3000 端口
echo ======================================================
pause
