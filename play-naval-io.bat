@echo off
setlocal enabledelayedexpansion
title naval.io - Server Running
cd /d "%~dp0"

set GAME_ENV=dev
set NUM_WORKERS=2
set TURNSTILE_SITE_KEY=1x00000000000000000000AA
set API_KEY=WARNING_DEV_API_KEY_DO_NOT_USE_IN_PRODUCTION
set DOMAIN=localhost
set GIT_COMMIT=DEV

echo.
echo  ============================================================
echo   naval.io - Starting...
echo  ============================================================
echo.

if not exist "node_modules" (
    echo  First run - installing dependencies...
    call npm run inst
    if errorlevel 1 (
        echo.
        echo  ERROR: Dependency install failed.
        echo  Make sure Node.js 22+ is installed from https://nodejs.org/
        pause
        exit /b 1
    )
)

echo  Starting server...
echo  Browser will open automatically when ready.
echo.

start "naval.io server" /min cmd /c "npm run dev > naval-io-server.log 2>&1"

echo  Waiting for server to boot...
set "VITE_URL="
set "WAIT_COUNT=0"

:waitloop
timeout /t 2 /nobreak >nul
set /a WAIT_COUNT+=1

if exist "naval-io-server.log" (
    for /f "tokens=*" %%A in ('findstr /r /c:"http://localhost:[0-9]*" naval-io-server.log 2^>nul') do (
        set "VITE_URL=%%A"
        goto found_url
    )
)

if %WAIT_COUNT% GEQ 15 (
    echo.
    echo  Server taking longer than expected. Opening browser to default port...
    start http://localhost:8787
    goto show_log
)

goto waitloop

:found_url
for /f "tokens=2" %%B in ("%VITE_URL%") do set "CLEAN_URL=%%B"
if "%CLEAN_URL%"=="" set "CLEAN_URL=%VITE_URL%"
set "CLEAN_URL=%CLEAN_URL: =%"

echo  Server is running at: %CLEAN_URL%
echo  Opening browser...
start "" "%CLEAN_URL%"

:show_log
echo.
echo  ============================================================
echo   naval.io is running!
echo  ============================================================
echo.
echo  If browser didn't open, manually visit:
echo     http://localhost:8787
echo     http://localhost:9000
echo.
echo  To STOP: close this window
echo.
echo  --- Live server log ---
echo.
powershell -Command "Get-Content naval-io-server.log -Wait"

pause
