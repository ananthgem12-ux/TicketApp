# Refresh Environment Variables in the Current PowerShell Session
$env:JAVA_HOME = "D:\Data\jdk-21"
$env:ANDROID_HOME = "D:\Data\Android\Sdk"
$env:ANDROID_SDK_ROOT = "D:\Data\Android\Sdk"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")

Write-Host "Environment refreshed for current PowerShell session!" -ForegroundColor Green
Write-Host "JAVA_HOME    : $env:JAVA_HOME"
Write-Host "ANDROID_HOME : $env:ANDROID_HOME"
Write-Host "Node Version : $(node -v)"
Write-Host "NPM Version  : $(npm.cmd -v)"
Write-Host "ADB Version  : $((adb --version | Select-Object -First 1))"
