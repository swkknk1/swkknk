@echo off
netsh advfirewall firewall delete rule name=Node_Port_3000
echo.
echo ======================================================
echo   Closed! 3000 port firewall rule deleted.
echo ======================================================
pause
