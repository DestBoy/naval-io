@echo off
setlocal enabledelayedexpansion
title naval.io - Auto-Updater

set "REPO_DIR=%~dp0"
set "REPO_DIR=%REPO_DIR:~0,-1%"
set "ZIP_FILE=%REPO_DIR%\naval-io-update.zip"
set "TEMP_DIR=%REPO_DIR%\naval-io-update-temp"

echo.
echo  ============================================================
echo   naval.io - Auto-Updater
echo  ============================================================
echo.

REM --- Step 1: Check zip exists ---
if not exist "%ZIP_FILE%" (
    echo  [ERROR] naval-io-update.zip not found next to this bat file.
    echo  Place the update zip at: %ZIP_FILE%
    echo.
    pause
    exit /b 1
)
echo  [1/6] Update zip found

REM --- Step 2: Check git ---
where git >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Git not installed. Install from https://git-scm.com/download/win
    pause
    exit /b 1
)
echo  [2/6] Git is installed

REM --- Step 3: Make sure we're in a git repo ---
cd /d "%REPO_DIR%"
if not exist ".git" (
    echo  [ERROR] This bat file must live INSIDE the naval-io repo folder.
    echo  Current location: %REPO_DIR%
    echo  Move this bat file into your naval-io folder and try again.
    pause
    exit /b 1
)
echo  [3/6] Git repo confirmed

REM --- Step 4: Fetch latest from GitHub (so we never push older code) ---
echo  [4/6] Fetching latest from GitHub...
git fetch origin main 2>nul

REM --- Step 5: Extract zip to temp, sync files (preserve .git + node_modules) ---
echo  [5/6] Extracting and syncing files...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TEMP_DIR%' -Force"
if errorlevel 1 (
    echo  [ERROR] Failed to extract zip.
    pause
    exit /b 1
)

set "EXTRACTED_DIR=%TEMP_DIR%\naval-io"
if not exist "%EXTRACTED_DIR%" set "EXTRACTED_DIR=%TEMP_DIR%"
if not exist "%EXTRACTED_DIR%" (
    echo  [ERROR] Extracted folder not found.
    pause
    exit /b 1
)

REM Robocopy: mirror extracted files into repo, EXCLUDING .git and node_modules
robocopy "%EXTRACTED_DIR%" "%REPO_DIR%" /E /XD .git node_modules >nul
if errorlevel 8 (
    echo  [ERROR] File sync failed.
    pause
    exit /b 1
)

rmdir /s /q "%TEMP_DIR%" 2>nul
del /f /q "%ZIP_FILE%" 2>nul

REM --- Step 6: Install deps + commit + push ---
echo  [6/6] Installing dependencies (10-30 seconds)...
call npm run inst
if errorlevel 1 (
    echo  [ERROR] Dependency install failed.
    pause
    exit /b 1
)

echo  Committing and pushing to GitHub...
git add -A
git diff --cached --quiet
if not errorlevel 1 (
    echo  No changes to commit - code is already up to date.
    pause
    exit /b 0
)

for /f "tokens=*" %%T in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set "TIMESTAMP=%%T"
git commit -m "Auto-update: %TIMESTAMP%"

git push origin main
if errorlevel 1 (
    echo.
    echo  [WARNING] Push failed. A browser may have opened for GitHub login.
    echo  Complete the login, then run this bat again.
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo   SUCCESS! Code updated + pushed to GitHub.
echo  ============================================================
echo.
echo  Repo: https://github.com/DestBoy/naval-io
echo  To play: double-click play-naval-io.bat
echo.
pause
