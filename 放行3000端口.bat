@echo off
netsh advfirewall firewall add rule name=Node_Port_3000 dir=in action=allow protocol=TCP localport=3000
echo.
echo ======================================================
echo   Success! 3000 port has been allowed.
echo   Phone URL: http://192.168.1.46:3000
echo ======================================================
pause
