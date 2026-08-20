@echo off
setlocal EnableDelayedExpansion
title TicketApp - APK Builder

:: ============================================================
::   TICKET APP / CHENNAI ONE - APK BUILD SCRIPT
::   Ionic + Angular + Capacitor + Android Gradle
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "ANDROID_DIR=%PROJECT_DIR%android"
set "WWW_DIR=%PROJECT_DIR%www"
set "APK_RELEASE=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-unsigned.apk"
set "APK_RELEASE_ALT=%ANDROID_DIR%\app\build\outputs\apk\release\app-release.apk"
set "APK_DEBUG=%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk"

:: Timestamp for output APK name
for /f "tokens=1-3 delims=/ " %%a in ("%DATE%") do set "DD=%%a" & set "MM=%%b" & set "YYYY=%%c"
for /f "tokens=1-2 delims=:." %%a in ("%TIME: =0%") do set "HH=%%a" & set "MIN=%%b"
set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%MIN%"

echo.
echo  ================================================================
echo    TICKET APP - APK BUILDER
echo  ================================================================
echo.
echo  [1] Build DEBUG APK     (Fastest - for testing on phone)
echo  [2] Build RELEASE APK   (Production APK)
echo  [3] Full Re-install     (npm install + build APK)
echo  [4] EXIT
echo.
set /p CHOICE="  Enter your choice (1-4): "

if "%CHOICE%"=="4" goto :END
if "%CHOICE%"=="1" set "BUILD_TYPE=debug"
if "%CHOICE%"=="2" set "BUILD_TYPE=release"
if "%CHOICE%"=="3" set "BUILD_TYPE=full"

if not defined BUILD_TYPE (
    echo  [ERROR] Invalid choice. Please enter 1-4.
    pause
    goto :END
)

if "%BUILD_TYPE%"=="full" (
    echo.
    echo  [STEP 1/4] Installing dependencies...
    cd /d "%PROJECT_DIR%"
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed!
        pause
        goto :END
    )
    set "BUILD_TYPE=debug"
)

:: ── Step 1: Angular Web Build ───────────────────────────────────
echo.
echo  [STEP 1/3] Building Angular Web Application...
echo  ----------------------------------------------------------------
cd /d "%PROJECT_DIR%"
call npx ng build
if %errorlevel% neq 0 (
    echo  [ERROR] Angular build failed! Check errors above.
    pause
    goto :END
)
echo  Angular build complete (www/ folder generated).

:: ── Step 2: Capacitor Sync ──────────────────────────────────────
echo.
echo  [STEP 2/3] Syncing Capacitor Assets to Android...
echo  ----------------------------------------------------------------
call npx cap sync android
if %errorlevel% neq 0 (
    echo  [ERROR] Capacitor sync failed!
    pause
    goto :END
)
echo  Capacitor sync complete.

:: ── Step 3: Gradle APK Build ────────────────────────────────────
echo.
echo  [STEP 3/3] Compiling Android APK...
echo  ----------------------------------------------------------------
cd /d "%ANDROID_DIR%"

if "%BUILD_TYPE%"=="debug" (
    call gradlew.bat assembleDebug
    if %errorlevel% neq 0 (
        echo  [ERROR] Gradle debug build failed!
        pause
        goto :END
    )
    if exist "%APK_DEBUG%" (
        copy /Y "%APK_DEBUG%" "%PROJECT_DIR%TicketApp-Debug.apk" >NUL
        copy /Y "%APK_DEBUG%" "%PROJECT_DIR%TicketApp-%TIMESTAMP%-debug.apk" >NUL
        echo.
        echo  ================================================================
        echo    BUILD SUCCESSFUL!
        echo  ================================================================
        echo   Output APK: %PROJECT_DIR%TicketApp-Debug.apk
        echo   Output APK: %PROJECT_DIR%TicketApp-%TIMESTAMP%-debug.apk
    )
)

if "%BUILD_TYPE%"=="release" (
    call gradlew.bat assembleRelease
    if %errorlevel% neq 0 (
        echo  [ERROR] Gradle release build failed!
        pause
        goto :END
    )
    if exist "%APK_RELEASE_ALT%" (
        copy /Y "%APK_RELEASE_ALT%" "%PROJECT_DIR%TicketApp-Release.apk" >NUL
        echo   Output APK: %PROJECT_DIR%TicketApp-Release.apk
    ) else if exist "%APK_RELEASE%" (
        copy /Y "%APK_RELEASE%" "%PROJECT_DIR%TicketApp-Release.apk" >NUL
        echo   Output APK: %PROJECT_DIR%TicketApp-Release.apk
    )
)

cd /d "%PROJECT_DIR%"
echo.
set /p OPEN="  Open folder in File Explorer? (Y/N): "
if /i "%OPEN%"=="Y" explorer "%PROJECT_DIR%"

:END
echo.
echo  Done. Press any key to close...
pause >NUL
endlocal
