@echo off
setlocal EnableDelayedExpansion
title TicketApp - Release APK Builder

:: ============================================================
::   TICKET APP / CHENNAI ONE - DIRECT RELEASE APK BUILDER
::   Builds signed Release APK using release.keystore (busapp)
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "ANDROID_DIR=%PROJECT_DIR%android"
set "APK_SOURCE=%ANDROID_DIR%\app\build\outputs\apk\release\app-release.apk"

echo.
echo  ================================================================
echo    BUILDING SIGNED RELEASE APK (TicketApp)
echo  ================================================================
echo.

:: ── Step 1: Angular Web Build ───────────────────────────────────
echo  [1/3] Building Angular Web Application...
cd /d "%PROJECT_DIR%"
call npx ng build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Angular build failed! Check errors above.
    pause
    exit /b %errorlevel%
)

:: ── Step 2: Sync Capacitor to Android ───────────────────────────
echo.
echo  [2/3] Syncing Capacitor Assets to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Capacitor sync failed! Check errors above.
    pause
    exit /b %errorlevel%
)

:: ── Step 3: Gradle Build Release APK with Keystore ─────────────
echo.
echo  [3/3] Compiling Signed Release APK with Gradle...
cd /d "%ANDROID_DIR%"
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Gradle release build failed! Check errors above.
    pause
    exit /b %errorlevel%
)

:: ── Copy APK to Root Folder ──────────────────────────────────────
cd /d "%PROJECT_DIR%"
if exist "%APK_SOURCE%" (
    copy /Y "%APK_SOURCE%" "%PROJECT_DIR%BusApp-Release-Signed.apk" >NUL
    copy /Y "%APK_SOURCE%" "%PROJECT_DIR%BusApp.apk" >NUL
    copy /Y "%APK_SOURCE%" "%PROJECT_DIR%TicketApp-Release.apk" >NUL
    
    echo.
    echo  ================================================================
    echo    BUILD SUCCESSFUL!
    echo  ================================================================
    echo.
    for %%F in ("%PROJECT_DIR%TicketApp-Release.apk") do (
        set /a SIZE_MB=%%~zF / 1048576
        echo   Generated Signed Release APK:
        echo   - TicketApp-Release.apk (!SIZE_MB! MB^)
        echo   - BusApp-Release-Signed.apk (!SIZE_MB! MB^)
    )
    echo.
    echo   Output Directory: %PROJECT_DIR%
    echo.
) else (
    echo.
    echo  [WARN] Built APK not found at expected path: %APK_SOURCE%
)

echo  Done. Press any key to close...
pause >NUL
endlocal
