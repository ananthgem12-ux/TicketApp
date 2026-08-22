@echo off
setlocal EnableDelayedExpansion
title ChennaiOne / TicketApp - Automated Environment Setup

:: ============================================================================
::   AUTOMATED DEVELOPMENT ENVIRONMENT SETUP SCRIPT
::   Installs Node.js, JDK 21, Android SDK, and Configures Environment in D:\Data
:: ============================================================================

set "PROJECT_DIR=%~dp0"
set "DATA_DIR=D:\Data"
set "NODE_DIR=%DATA_DIR%\nodejs"
set "JDK_DIR=%DATA_DIR%\jdk-21"
set "SDK_DIR=%DATA_DIR%\Android\Sdk"
set "CMDLINE_DIR=%SDK_DIR%\cmdline-tools\latest"

echo.
echo  ========================================================================
echo    CHENNAI ONE / TICKET APP - AUTOMATED ENVIRONMENT SETUP
echo  ========================================================================
echo.
echo   Target Directory: %DATA_DIR%
echo   Project Root    : %PROJECT_DIR%
echo.

if not exist "%DATA_DIR%" (
    echo  [*] Creating directory %DATA_DIR%...
    mkdir "%DATA_DIR%"
)

:: ----------------------------------------------------------------------------
:: 1. NODE.JS LTS SETUP
:: ----------------------------------------------------------------------------
echo.
echo  [1/6] Checking Node.js LTS...
if exist "%NODE_DIR%\node.exe" (
    echo      [OK] Node.js is already installed at: %NODE_DIR%
    goto :CHECK_JDK
)

echo      [*] Downloading and extracting Node.js LTS...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; $zip = '%DATA_DIR%\node.zip'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip' -OutFile $zip; Expand-Archive -Path $zip -DestinationPath '%DATA_DIR%' -Force; Remove-Item $zip -Force; Move-Item '%DATA_DIR%\node-v22.14.0-win-x64' '%NODE_DIR%' -Force;"
if exist "%NODE_DIR%\npm.ps1" del /f /q "%NODE_DIR%\npm.ps1" >NUL 2>&1
if exist "%NODE_DIR%\npx.ps1" del /f /q "%NODE_DIR%\npx.ps1" >NUL 2>&1
echo      [OK] Node.js installed.

:CHECK_JDK
set "PATH=%NODE_DIR%;%PATH%"

:: ----------------------------------------------------------------------------
:: 2. JAVA JDK 21 SETUP
:: ----------------------------------------------------------------------------
echo.
echo  [2/6] Checking Java OpenJDK 21 LTS...
if exist "%JDK_DIR%\bin\javac.exe" (
    echo      [OK] JDK 21 is already installed at: %JDK_DIR%
    goto :CHECK_SDK
)

echo      [*] Downloading and extracting Eclipse Adoptium OpenJDK 21...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; $zip = '%DATA_DIR%\jdk21.zip'; Invoke-WebRequest -Uri 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.6_7.zip' -OutFile $zip; Expand-Archive -Path $zip -DestinationPath '%DATA_DIR%' -Force; Remove-Item $zip -Force; $dir = Get-ChildItem '%DATA_DIR%' -Directory | Where-Object { $_.Name -match 'jdk-21' } | Select-Object -First 1; if ($dir -and $dir.FullName -ne '%JDK_DIR%') { Move-Item $dir.FullName '%JDK_DIR%' -Force }"
echo      [OK] JDK 21 installed.

:CHECK_SDK
set "JAVA_HOME=%JDK_DIR%"
set "PATH=%JDK_DIR%\bin;%PATH%"

:: ----------------------------------------------------------------------------
:: 3. ANDROID SDK SETUP
:: ----------------------------------------------------------------------------
echo.
echo  [3/6] Checking Android SDK Command-line and Platform Tools...
if not exist "%SDK_DIR%" mkdir "%SDK_DIR%"
if not exist "%SDK_DIR%\cmdline-tools" mkdir "%SDK_DIR%\cmdline-tools"

if exist "%CMDLINE_DIR%\bin\sdkmanager.bat" (
    echo      [OK] Command-line tools already present.
    goto :CHECK_PLATFORM_TOOLS
)

echo      [*] Downloading Android Command-line Tools...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; $zip = '%DATA_DIR%\cmdline.zip'; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile $zip; Expand-Archive -Path $zip -DestinationPath '%SDK_DIR%\cmdline-tools' -Force; Remove-Item $zip -Force; if (Test-Path '%SDK_DIR%\cmdline-tools\cmdline-tools') { if (Test-Path '%CMDLINE_DIR%') { Remove-Item '%CMDLINE_DIR%' -Recurse -Force }; Move-Item '%SDK_DIR%\cmdline-tools\cmdline-tools' '%CMDLINE_DIR%' -Force }"
echo      [OK] Command-line tools installed.

:CHECK_PLATFORM_TOOLS
if exist "%SDK_DIR%\platform-tools\adb.exe" (
    echo      [OK] Platform tools already present.
    goto :CHECK_SDK_PLATFORMS
)

echo      [*] Downloading Android Platform Tools...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; $zip = '%DATA_DIR%\platformtools.zip'; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip' -OutFile $zip; Expand-Archive -Path $zip -DestinationPath '%SDK_DIR%' -Force; Remove-Item $zip -Force;"
echo      [OK] Platform tools installed.

:CHECK_SDK_PLATFORMS
set "ANDROID_HOME=%SDK_DIR%"
set "ANDROID_SDK_ROOT=%SDK_DIR%"
set "PATH=%CMDLINE_DIR%\bin;%SDK_DIR%\platform-tools;%PATH%"

:: ----------------------------------------------------------------------------
:: 4. ANDROID SDK PLATFORMS & BUILD TOOLS
:: ----------------------------------------------------------------------------
echo.
echo  [4/6] Checking Android Platforms API 36 and Build-Tools...
if exist "%SDK_DIR%\platforms\android-36" (
    echo      [OK] Android SDK Platforms API 36 already installed.
    goto :SETUP_ENV_VARS
)

echo      [*] Accepting licenses and downloading Android API 36 and Build Tools...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:JAVA_HOME = '%JDK_DIR%'; $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'echo y | \"%CMDLINE_DIR%\bin\sdkmanager.bat\" --sdk_root=\"%SDK_DIR%\" --licenses' -NoNewWindow -PassThru -Wait; & '%CMDLINE_DIR%\bin\sdkmanager.bat' --sdk_root='%SDK_DIR%' 'platforms;android-36' 'build-tools;36.0.0' 'platforms;android-34' 'build-tools;34.0.0'"
echo      [OK] Android Platforms and Build-Tools installed.

:SETUP_ENV_VARS
:: ----------------------------------------------------------------------------
:: 5. GLOBAL CLI PACKAGES & ENVIRONMENT VARIABLES
:: ----------------------------------------------------------------------------
echo.
echo  [5/6] Configuring Environment Variables and Global CLIs...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Environment]::SetEnvironmentVariable('JAVA_HOME', '%JDK_DIR%', [EnvironmentVariableTarget]::User); " ^
    "[Environment]::SetEnvironmentVariable('ANDROID_HOME', '%SDK_DIR%', [EnvironmentVariableTarget]::User); " ^
    "[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', '%SDK_DIR%', [EnvironmentVariableTarget]::User); " ^
    "$cur = [Environment]::GetEnvironmentVariable('Path', [EnvironmentVariableTarget]::User); " ^
    "$paths = @('%NODE_DIR%', '%JDK_DIR%\bin', '%CMDLINE_DIR%\bin', '%SDK_DIR%\platform-tools'); " ^
    "$arr = $cur -split ';' | Where-Object { $_ -ne '' }; " ^
    "foreach ($p in $paths) { if ($arr -notcontains $p) { $arr += $p } }; " ^
    "[Environment]::SetEnvironmentVariable('Path', ($arr -join ';'), [EnvironmentVariableTarget]::User); " ^
    "try { Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force -ErrorAction SilentlyContinue } catch {}; " ^
    "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + [System.Environment]::GetEnvironmentVariable('Path','Machine'); " ^
    "$env:JAVA_HOME = '%JDK_DIR%'; " ^
    "$env:ANDROID_HOME = '%SDK_DIR%';"

echo      [OK] Windows User environment variables configured.

if exist "%PROJECT_DIR%android" (
    echo sdk.dir=D\:\\Data\\Android\\Sdk> "%PROJECT_DIR%android\local.properties"
    echo      [OK] Updated android\local.properties
)

:: ----------------------------------------------------------------------------
:: 6. PROJECT NPM DEPENDENCIES
:: ----------------------------------------------------------------------------
echo.
echo  [6/6] Checking project npm dependencies...
if exist "%PROJECT_DIR%node_modules" (
    echo      [OK] node_modules directory exists.
    goto :SUMMARY
)

echo      [*] Installing project npm packages...
cd /d "%PROJECT_DIR%"
call "%NODE_DIR%\npm.cmd" install --legacy-peer-deps

:SUMMARY
:: ----------------------------------------------------------------------------
:: VERIFICATION & SUMMARY
:: ----------------------------------------------------------------------------
echo.
echo  ========================================================================
echo    SETUP COMPLETE AND VERIFIED
echo  ========================================================================
echo.
echo   [+] Node.js      :
call "%NODE_DIR%\node.exe" -v
echo   [+] NPM          :
call "%NODE_DIR%\npm.cmd" -v
echo   [+] Java JDK     :
call "%JDK_DIR%\bin\javac.exe" -version
echo   [+] Android ADB  :
call "%SDK_DIR%\platform-tools\adb.exe" --version | findstr /i "version"
echo.
echo   Environment variables are saved to your Windows User profile.
echo   For any currently open PowerShell terminal, you can run:
echo     . .\refresh_env.ps1
echo   or open a new terminal tab.
echo.
echo   You can now build APKs anytime using: build.bat or build_apk.bat
echo  ========================================================================
echo.
pause
endlocal
