@echo off
set PORT=8420
set LAN_FLAG=

if "%1"=="--lan" set LAN_FLAG=--lan

echo Starting Mijn Kijklijst on http://localhost:%PORT%
echo Stop met Ctrl+C
echo.

:: Open browser na korte vertraging
start "" "http://localhost:%PORT%"

:: Start server
python server.py %PORT% %LAN_FLAG%
