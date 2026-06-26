@echo off
chcp 65001 >nul
title 双栖宇宙 - APK自动打包工具
echo ========================================
echo    双栖宇宙 - 一键APK打包工具
echo ========================================
echo.

setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
set "TOOLS_DIR=%PROJECT_DIR%build-tools"
set "JDK_DIR=%TOOLS_DIR%\jdk-17.0.19+10"
if exist "%TOOLS_DIR%\jdk-17" set "JDK_DIR=%TOOLS_DIR%\jdk-17"
set "ANDROID_SDK_ROOT=%TOOLS_DIR%\android-sdk"
set "ANDROID_HOME=%ANDROID_SDK_ROOT%"
set "CMDTOOLS_DIR=%ANDROID_SDK_ROOT%\cmdline-tools\latest"

:: 创建目录
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"
if not exist "%ANDROID_SDK_ROOT%" mkdir "%ANDROID_SDK_ROOT%"

:: ========== 第一步：检查/安装 JDK 17 ==========
echo [1/6] 检查 Java 环境...
if exist "%JDK_DIR%\bin\java.exe" (
    echo   [√] JDK 已就绪
) else (
    echo   正在下载 JDK 17 (清华镜像, ~160MB)...
    powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://mirrors.tuna.tsinghua.edu.cn/Adoptium/17/jdk/x64/windows/OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10.zip' -OutFile '%TOOLS_DIR%\jdk.zip' -UseBasicParsing }"
    echo   正在解压 JDK...
    powershell -Command "& { Expand-Archive -Path '%TOOLS_DIR%\jdk.zip' -DestinationPath '%TOOLS_DIR%' -Force }"
    del "%TOOLS_DIR%\jdk.zip"
    echo   [√] JDK 安装完成
)

set "JAVA_HOME=%JDK_DIR%"
set "PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\platform-tools;%CMDTOOLS_DIR%\bin;%PATH%"

echo   JDK版本:
"%JAVA_HOME%\bin\java.exe" -version 2>&1 | findstr "version"
echo.

:: ========== 第二步：检查/安装 Android Command Line Tools ==========
echo [2/6] 检查 Android SDK...
if exist "%CMDTOOLS_DIR%\bin\sdkmanager.bat" (
    echo   [√] Android命令行工具已就绪
) else (
    echo   正在下载 Android Command Line Tools (~150MB)...
    powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile '%TOOLS_DIR%\cmdtools.zip' -UseBasicParsing }"
    echo   正在解压...
    if exist "%ANDROID_SDK_ROOT%\cmdline-tools" rmdir /s /q "%ANDROID_SDK_ROOT%\cmdline-tools"
    powershell -Command "& { Expand-Archive -Path '%TOOLS_DIR%\cmdtools.zip' -DestinationPath '%ANDROID_SDK_ROOT%\cmdline-tools-temp' -Force }"
    mkdir "%CMDTOOLS_DIR%" 2>nul
    xcopy /e /h /y "%ANDROID_SDK_ROOT%\cmdline-tools-temp\cmdline-tools\*" "%CMDTOOLS_DIR%\"
    rmdir /s /q "%ANDROID_SDK_ROOT%\cmdline-tools-temp"
    del "%TOOLS_DIR%\cmdtools.zip"
    echo   [√] 命令行工具安装完成
)
echo.

:: ========== 第三步：安装 Android SDK 组件 ==========
echo [3/6] 安装 Android SDK 组件...
if not exist "%ANDROID_SDK_ROOT%\platforms\android-34" (
    echo   正在接受SDK许可协议...
    (echo y; echo y; echo y; echo y; echo y) | "%CMDTOOLS_DIR%\bin\sdkmanager.bat" --sdk_root="%ANDROID_SDK_ROOT%" --licenses >nul 2>&1
    echo   正在下载 Android SDK Platform 34、Build Tools...
    "%CMDTOOLS_DIR%\bin\sdkmanager.bat" --sdk_root="%ANDROID_SDK_ROOT%" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
    echo   [√] SDK组件安装完成
) else (
    echo   [√] Android SDK 34 已就绪
)
echo.

:: ========== 第四步：构建Web资源 ==========
echo [4/6] 构建Web资源...
call npm run build
if errorlevel 1 (
    echo   [×] Web构建失败！
    pause
    exit /b 1
)
echo   [√] Web构建完成
echo.

:: ========== 第五步：同步 Android 平台 ==========
echo [5/6] 同步资源到Android项目...
if not exist "%PROJECT_DIR%android" (
    echo   首次添加Android平台...
    call npx cap add android
) else (
    echo   同步资源...
    call npx cap sync android
)
if errorlevel 1 (
    echo   [×] 同步失败！
    pause
    exit /b 1
)
echo   [√] 同步完成
echo.

:: ========== 第六步：构建APK ==========
echo [6/6] 正在构建 APK (首次构建需要下载Gradle和依赖，请耐心等待)...
cd /d "%PROJECT_DIR%android"
set "JAVA_HOME=%JDK_DIR%"
set "ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%"
set "ANDROID_HOME=%ANDROID_SDK_ROOT%"
set "PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\platform-tools;%PATH%"
call gradlew.bat assembleDebug
cd /d "%PROJECT_DIR%"

set "APK_PATH=%PROJECT_DIR%android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_PATH%" (
    echo.
    echo ========================================
    echo    打包成功！🎉
    echo ========================================
    echo.
    echo   APK文件: %PROJECT_DIR%双栖宇宙.apk
    echo.
    copy /y "%APK_PATH%" "%PROJECT_DIR%双栖宇宙.apk"
    echo   把「双栖宇宙.apk」传到手机上即可安装！
    echo.
    explorer /select,"%PROJECT_DIR%双栖宇宙.apk"
) else (
    echo.
    echo   [×] 构建失败，请检查上方错误信息
)

pause
