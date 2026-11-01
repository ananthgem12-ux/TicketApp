@echo off
setlocal EnableDelayedExpansion
title ChennaiOne / TicketApp - Project Launcher & Builder

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:MENU
cls
echo.
echo  ========================================================================
echo    CHENNAI ONE / TICKET APP - MASTER PROJECT LAUNCHER
echo  ========================================================================
echo.
echo   Project Path: %PROJECT_DIR%
echo.
echo   [1] RUN WEB APP (Start Dev Server & Open in Browser - http://localhost:4200)
echo   [2] BUILD WEB APP (Compile Angular Production Bundle to www\)
echo   [3] SYNC TO ANDROID (Push latest web build into Android project)
echo   [4] BUILD SIGNED RELEASE APK (Complete Web + Capacitor + Signed APK)
echo   [5] BUILD DEBUG APK (For testing / emulator / ADB install)
echo   [6] SETUP ENVIRONMENT (Download & Configure Java JDK 21 and Android SDK)
echo   [7] EXIT
echo.
echo  ========================================================================
set /p CHOICE="  Enter choice [1-7]: "

if "%CHOICE%"=="1" goto :RUN_WEB
if "%CHOICE%"=="2" goto :BUILD_WEB
if "%CHOICE%"=="3" goto :SYNC_ANDROID
if "%CHOICE%"=="4" goto :BUILD_RELEASE
if "%CHOICE%"=="5" goto :BUILD_DEBUG
if "%CHOICE%"=="6" goto :SETUP_ENV
if "%CHOICE%"=="7" goto :EXIT

echo.
echo  [ERROR] Invalid choice. Please select 1 to 7.
timeout /t 2 >NUL
goto :MENU

:: ----------------------------------------------------------------------------
:: 1. RUN WEB APP (DEV SERVER)
:: ----------------------------------------------------------------------------
:RUN_WEB
echo.
echo  ========================================================================
echo    STARTING LOCAL DEVELOPMENT SERVER
echo  ========================================================================
echo.
if not exist "node_modules" (
    echo  [*] Installing dependencies first...
    call npm install --legacy-peer-deps
)
echo  [*] Launching Angular dev server on http://localhost:4200 ...
echo  [*] Press Ctrl+C in this window anytime to stop the server.
echo.
call npx ng serve --open
echo.
pause
goto :MENU

:: ----------------------------------------------------------------------------
:: 2. BUILD WEB APP (PRODUCTION)
:: ----------------------------------------------------------------------------
:BUILD_WEB
echo.
echo  ========================================================================
echo    BUILDING ANGULAR PRODUCTION BUNDLE
echo  ========================================================================
echo.
if not exist "node_modules" (
    echo  [*] Installing dependencies first...
    call npm install --legacy-peer-deps
)
echo  [*] Compiling Angular application to www\ ...
call npx ng build --configuration=production
if %errorlevel% equ 0 (
    echo.
    echo  [OK] Build completed successfully! Output: %PROJECT_DIR%www\
) else (
    echo.
    echo  [ERROR] Angular build failed! See errors above.
)
echo.
pause
goto :MENU

:: ----------------------------------------------------------------------------
:: 3. SYNC TO ANDROID
:: ----------------------------------------------------------------------------
:SYNC_ANDROID
echo.
echo  ========================================================================
echo    SYNCING CAPACITOR ASSETS TO ANDROID
echo  ========================================================================
echo.
if not exist "www\index.html" (
    echo  [*] www\ not found. Building web app first...
    call npx ng build
)
echo  [*] Syncing Capacitor to Android...
call npx cap sync android
if %errorlevel% equ 0 (
    echo.
    echo  [OK] Capacitor sync completed successfully!
) else (
    echo.
    echo  [ERROR] Capacitor sync failed! See errors above.
)
echo.
pause
goto :MENU

:: ----------------------------------------------------------------------------
:: 4. BUILD SIGNED RELEASE APK
:: ----------------------------------------------------------------------------
:BUILD_RELEASE
echo.
echo  ========================================================================
echo    BUILDING SIGNED RELEASE APK
echo  ========================================================================
echo.
call "%PROJECT_DIR%build.bat"
goto :MENU

:: ----------------------------------------------------------------------------
:: 5. BUILD DEBUG APK
:: ----------------------------------------------------------------------------
:BUILD_DEBUG
echo.
echo  ========================================================================
echo    BUILDING DEBUG APK
echo  ========================================================================
echo.
if not exist "www\index.html" (
    echo  [*] Building web app first...
    call npx ng build
)
echo  [*] Syncing Capacitor...
call npx cap sync android

:: Auto-detect JAVA_HOME
if not defined JAVA_HOME (
    if exist "D:\Data\jdk-21" set "JAVA_HOME=D:\Data\jdk-21"
    if exist "C:\AndroidDev\jdk-21" set "JAVA_HOME=C:\AndroidDev\jdk-21"
    if exist "%USERPROFILE%\AndroidDev\jdk-21" set "JAVA_HOME=%USERPROFILE%\AndroidDev\jdk-21"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

echo  [*] Running Gradle assembleDebug...
cd /d "%PROJECT_DIR%android"
call gradlew.bat assembleDebug
cd /d "%PROJECT_DIR%"

set "DEBUG_APK=%PROJECT_DIR%android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%DEBUG_APK%" (
    copy /Y "%DEBUG_APK%" "%PROJECT_DIR%BusApp-Debug.apk" >NUL
    echo.
    echo  ========================================================================
    echo    DEBUG APK GENERATED: BusApp-Debug.apk
    echo  ========================================================================
) else (
    echo.
    echo  [ERROR] Debug APK build failed or output not found.
    echo  (Make sure Java JDK 21 and Android SDK are installed via Option 6)
)
echo.
pause
goto :MENU

:: ----------------------------------------------------------------------------
:: 6. SETUP ENVIRONMENT (JAVA + ANDROID SDK)
:: ----------------------------------------------------------------------------
:SETUP_ENV
echo.
echo  ========================================================================
echo    LAUNCHING AUTOMATED ENVIRONMENT SETUP
echo  ========================================================================
echo.
call "%PROJECT_DIR%setup.bat"
goto :MENU

:EXIT
echo.
echo  Goodbye!
endlocal

