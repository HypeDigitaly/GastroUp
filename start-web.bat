@echo off
title GastroUp - local website
cd /d "%~dp0"

echo.
echo  ============================================
echo   GastroUp - local preview
echo  ============================================
echo.

REM -- install dependencies on first run --
if not exist node_modules (
    echo  Installing dependencies - first run only...
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR: npm install failed. Is Node.js installed?
        pause
        exit /b 1
    )
)

echo  Building site from src/ ...
call npm run build
if errorlevel 1 (
    echo.
    echo  ERROR: build failed - see message above.
    pause
    exit /b 1
)

echo.
echo  Opening browser...
start "" http://localhost:8765

node scripts\serve.js
pause
