@echo off
setlocal EnableDelayedExpansion
title ChennaiOne - APK Builder

:: ============================================================
::   CHENNAI ONE - MTC BUS APP  /  APK BUILD SCRIPT
::   Ionic + Angular + Capacitor + Android Gradle
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "ANDROID_DIR=%PROJECT_DIR%android"
set "WWW_DIR=%PROJECT_DIR%www"
set "APK_RELEASE=%ANDROID_DIR%\app\build\outputs\apk\release\app-release.apk"
set "APK_DEBUG=%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk"
set "KEYSTORE=%ANDROID_DIR%\app\release.keystore"
set "KEY_ALIAS=busapp"
set "KEY_PASS=busapp123"
set "STORE_PASS=busapp123"

:: Timestamp for output APK name
for /f "tokens=1-3 delims=/ " %%a in ("%DATE%") do set "DD=%%a" & set "MM=%%b" & set "YYYY=%%c"
for /f "tokens=1-2 delims=:." %%a in ("%TIME: =0%") do set "HH=%%a" & set "MIN=%%b"
set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%MIN%"

echo.
echo  ================================================================
echo    CHENNAI ONE APK BUILDER
echo  ================================================================
echo.
echo  [1] Build RELEASE APK  (Signed - Install on any phone)
echo  [2] Build DEBUG APK    (For testing / ADB install)
echo  [3] Build BOTH         (Release + Debug)
echo  [4] Quick Rebuild      (Skip npm install, just build + sync)
echo  [5] EXIT
echo.
set /p CHOICE="  Enter your choice (1-5): "

if "%CHOICE%"=="5" goto :END
if "%CHOICE%"=="1" set "BUILD_TYPE=release"
if "%CHOICE%"=="2" set "BUILD_TYPE=debug"
if "%CHOICE%"=="3" set "BUILD_TYPE=both"
if "%CHOICE%"=="4" set "BUILD_TYPE=quick"

if not defined BUILD_TYPE (
    echo  [ERROR] Invalid choice. Please enter 1-5.
    pause
    goto :END
)

:: ── Step 1: Export MTC Bus Asset (always run to keep it fresh) ──────────
echo.
echo  [STEP 1/5] Exporting MTC database to JSON asset...
echo  ----------------------------------------------------------------
python "%PROJECT_DIR%mtc_database\export_bus_asset.py"
if %errorlevel% neq 0 (
    echo  [WARN] MTC export failed (non-fatal - using existing asset)
)
echo  Done.

:: ── Step 2: npm install (skip for quick build) ──────────────────────────
if "%BUILD_TYPE%"=="quick" goto :STEP3

echo.
echo  [STEP 2/5] Installing npm dependencies...
echo  ----------------------------------------------------------------
cd /d "%PROJECT_DIR%"
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed! Check errors above.
    pause
    goto :END
)

:STEP3
:: ── Step 3: Angular Production Build ────────────────────────────────────
echo.
echo  [STEP 3/5] Building Angular app (production)...
echo  ----------------------------------------------------------------
cd /d "%PROJECT_DIR%"
call npx ng build --configuration=production
if %errorlevel% neq 0 (
    echo  [ERROR] Angular build failed! Check errors above.
    pause
    goto :END
)
echo  Angular build complete. Output: www\

:: ── Step 4: Capacitor Sync ──────────────────────────────────────────────
echo.
echo  [STEP 4/5] Syncing Capacitor to Android...
echo  ----------------------------------------------------------------
call npx cap sync android
if %errorlevel% neq 0 (
    echo  [ERROR] Capacitor sync failed!
    pause
    goto :END
)
echo  Capacitor sync complete.

:: ── Step 5: Gradle Build ────────────────────────────────────────────────
echo.
echo  [STEP 5/5] Building Android APK with Gradle...
echo  ----------------------------------------------------------------
cd /d "%ANDROID_DIR%"

if "%BUILD_TYPE%"=="release" goto :BUILD_RELEASE
if "%BUILD_TYPE%"=="quick"   goto :BUILD_RELEASE
if "%BUILD_TYPE%"=="debug"   goto :BUILD_DEBUG
if "%BUILD_TYPE%"=="both"    goto :BUILD_BOTH

:BUILD_RELEASE
echo  Building RELEASE APK...
call gradlew.bat assembleRelease --stacktrace
if %errorlevel% neq 0 (
    echo  [ERROR] Gradle release build failed!
    pause
    goto :END
)
call :COPY_APK release
if "%BUILD_TYPE%"=="both" goto :BUILD_DEBUG
goto :SUCCESS

:BUILD_DEBUG
echo  Building DEBUG APK...
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo  [ERROR] Gradle debug build failed!
    pause
    goto :END
)
call :COPY_APK debug
goto :SUCCESS

:BUILD_BOTH
call :BUILD_RELEASE
call :BUILD_DEBUG
goto :SUCCESS

:: ── Copy APK to project root ─────────────────────────────────────────────
:COPY_APK
set "TYPE=%~1"
cd /d "%PROJECT_DIR%"

if "%TYPE%"=="release" (
    if exist "%APK_RELEASE%" (
        copy /Y "%APK_RELEASE%" "%PROJECT_DIR%BusApp-Release-Signed.apk" >NUL
        copy /Y "%APK_RELEASE%" "%PROJECT_DIR%BusApp.apk" >NUL
        copy /Y "%APK_RELEASE%" "%PROJECT_DIR%BusApp-%TIMESTAMP%.apk" >NUL
        echo  [COPIED] BusApp-Release-Signed.apk
        echo  [COPIED] BusApp.apk
        echo  [COPIED] BusApp-%TIMESTAMP%.apk
    ) else (
        echo  [WARN] Release APK not found at expected path.
    )
)

if "%TYPE%"=="debug" (
    if exist "%APK_DEBUG%" (
        copy /Y "%APK_DEBUG%" "%PROJECT_DIR%ChennaiOne-debug.apk" >NUL
        echo  [COPIED] ChennaiOne-debug.apk
    ) else (
        echo  [WARN] Debug APK not found at expected path.
    )
)
goto :EOF

:SUCCESS
cd /d "%PROJECT_DIR%"
echo.
echo  ================================================================
echo    BUILD SUCCESSFUL!
echo  ================================================================
echo.

if exist "%PROJECT_DIR%BusApp-Release-Signed.apk" (
    for %%F in ("%PROJECT_DIR%BusApp-Release-Signed.apk") do (
        set /a SIZE_MB=%%~zF / 1048576
        echo   Release APK : BusApp-Release-Signed.apk  (!SIZE_MB! MB^)
    )
)
if exist "%PROJECT_DIR%BusApp-%TIMESTAMP%.apk" (
    echo   Timestamped : BusApp-%TIMESTAMP%.apk
)
if exist "%PROJECT_DIR%ChennaiOne-debug.apk" (
    for %%F in ("%PROJECT_DIR%ChennaiOne-debug.apk") do (
        set /a SIZE_MB=%%~zF / 1048576
        echo   Debug APK   : ChennaiOne-debug.apk  (!SIZE_MB! MB^)
    )
)

echo.
echo   Location: %PROJECT_DIR%
echo.

:: Ask to open folder in Explorer
set /p OPEN="  Open output folder in Explorer? (Y/N): "
if /i "%OPEN%"=="Y" explorer "%PROJECT_DIR%"

:END
echo.
echo  Done. Press any key to close...
pause >NUL
endlocal
