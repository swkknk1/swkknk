@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo   正在为 Windows 防火墙放行 3000 端口...
echo ======================================================
echo.

netsh advfirewall firewall add rule name=Node_Port_3000 dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo   ✅【放行成功！】
    echo   手机现在可以正常访问: http://192.168.1.46:3000
    echo ======================================================
    echo.
) else (
    echo.
    echo ======================================================
    echo   ⚠️【需要管理员权限】
    echo.
    echo   请在【放行3000端口(允许手机访问).bat】文件上：
    echo   👉【点击鼠标右键】
    echo   👉 选择【以管理员身份运行】！
    echo ======================================================
    echo.
)

pause
