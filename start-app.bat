@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 设置标题
title GreenWeb 启动工具

echo  ===============================================
echo           GreenWeb 启动工具                
echo  ===============================================
echo.                                                                                                                                 ";
:: 检查Node.js和npm是否安装
echo 检查环境依赖...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js未安装，准备自动安装...
    call :InstallNodeJS
) else (
    for /f "tokens=*" %%i in ('node -v') do set nodeVersion=%%i
    echo 已安装Node.js版本: !nodeVersion!
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm未安装，可能需要重新安装Node.js...
    call :InstallNodeJS
) else (
    for /f "tokens=*" %%i in ('npm -v') do set npmVersion=%%i
    echo 已安装npm版本: !npmVersion!
)

:: 检查项目依赖是否安装
if not exist "node_modules" (
    echo 项目依赖未安装，准备安装...
    
    :: 检查package.json文件是否存在
    if not exist "package.json" (
        echo 错误：未找到package.json文件，请确保在正确的项目目录中执行此脚本。
        goto End
    )
    
    echo 正在安装项目依赖，这可能需要几分钟...
    call npm install
    call cd server
    call npm install
    call cd ..
    if !errorlevel! neq 0 (
        echo 依赖安装失败，请检查网络连接或手动运行 npm install
        goto End
    )
    echo 依赖安装完成！
) else if not exist "server/node_modules" (
    echo 正在安装项目依赖，这可能需要几分钟...
    call cd server
    call npm install
    call cd ..
    echo 依赖安装完成!
)else (
    echo 项目依赖已安装
)

:Menu
echo.
echo  ===============================================
echo                请选择启动模式                
echo  -----------------------------------------------
echo   1. 开发模式 (前后端分离)                   
echo   2. 生产模式 (整合前后端)                   
echo   3. 仅构建项目                             
echo   4. 更新项目依赖                           
echo   5. 退出                                  
echo  ===============================================
echo.

set /p choice=请选择操作 (1-5): 

if "%choice%"=="1" (
    call :StartDevMode
) else if "%choice%"=="2" (
    call :StartProdMode
) else if "%choice%"=="3" (
    call :BuildProject
) else if "%choice%"=="4" (
    call :UpdateDependencies
) else if "%choice%"=="5" (
    echo 退出程序...
    exit /b
) else (
    echo 无效的选择，请重新输入！
    goto Menu
)

goto End

:InstallNodeJS
echo.
echo 准备安装Node.js...
echo 正在下载Node.js安装程序...

:: 创建临时目录
set tempDir=%temp%\NodeJSInstall
mkdir %tempDir% 2>nul

:: 检查是否已安装curl
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo 未找到curl工具，使用PowerShell下载...
    
    echo 使用PowerShell下载Node.js...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile '%tempDir%\nodejs_setup.msi'}"
) else (
    :: 使用curl下载Node.js安装程序
    curl -L -o "%tempDir%\nodejs_setup.msi" "https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi"
)

if not exist "%tempDir%\nodejs_setup.msi" (
    echo 下载Node.js失败，请手动访问 https://nodejs.org/ 下载并安装
    start https://nodejs.org/
    goto End
)

echo 下载完成，开始安装Node.js...
:: 静默安装Node.js
msiexec /i "%tempDir%\nodejs_setup.msi" /qn
if %errorlevel% neq 0 (
    echo Node.js安装失败，尝试手动安装...
    start "" "%tempDir%\nodejs_setup.msi"
    goto End
)

echo Node.js安装完成！
echo 请重新启动此脚本以继续操作...
goto End

:StartDevMode
echo 启动开发模式...

:: 检查并关闭占用端口的进程
call :CheckAndClosePort 3000
call :CheckAndClosePort 5173

:: 确保package.json中有相应的脚本命令
findstr /c:"\"server:dev\"" package.json >nul
if %errorlevel% neq 0 (
    echo 警告：package.json 中未找到 "server:dev" 脚本。
    echo 请确保项目配置正确。
    goto End
)

findstr /c:"\"dev\"" package.json >nul
if %errorlevel% neq 0 (
    echo 警告：package.json 中未找到 "dev" 脚本。
    echo 请确保项目配置正确。
    goto End
)

echo 1. 启动后端服务器...
start cmd /k "cd /d %~dp0 && npm run server:dev"
echo 2. 启动前端开发服务器...
start cmd /k "cd /d %~dp0 && npm run dev"
echo 服务已启动! 请在浏览器中打开 http://localhost:5173
goto End

:StartProdMode
echo 启动生产模式...

:: 检查并关闭占用端口的进程
call :CheckAndClosePort 3000

:: 确保package.json中有相应的脚本命令
findstr /c:"\"build\"" package.json >nul
if %errorlevel% neq 0 (
    echo 警告：package.json 中未找到 "build" 脚本。
    echo 请确保项目配置正确。
    goto End
)

findstr /c:"\"start\"" package.json >nul
if %errorlevel% neq 0 (
    echo 警告：package.json 中未找到 "start" 脚本。
    echo 请确保项目配置正确。
    goto End
)

echo 1. 构建前端应用...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败，请检查错误信息
    goto End
)

echo 2. 启动整合服务器...
start cmd /k "cd /d %~dp0 && npm run start"

echo 服务已启动! 请在浏览器中打开 http://localhost:3000
goto End

:BuildProject
echo 执行项目构建...

:: 确保package.json中有相应的脚本命令
findstr /c:"\"build\"" package.json >nul
if %errorlevel% neq 0 (
    echo 警告：package.json 中未找到 "build" 脚本。
    echo 请确保项目配置正确。
    goto End
)

call npm run build
if %errorlevel% neq 0 (
    echo 构建失败，请检查错误信息
) else (
    echo 构建完成！可以通过 npm run start 启动服务
)
goto End

:UpdateDependencies
echo 更新项目依赖...
call npm update
if %errorlevel% neq 0 (
    echo 依赖更新失败，请检查网络连接或手动运行 npm update
) else (
    echo 依赖更新完成！
)
goto End

:CheckAndClosePort
echo 检查端口 %1 占用情况...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :%1 ^| findstr LISTENING') DO (
    echo 发现进程占用端口 %1: %%P, 尝试关闭...
    taskkill /F /PID %%P 2>NUL
    if !errorlevel! equ 0 (
        echo 端口 %1 已释放
    ) else (
        echo 无法释放端口 %1，可能需要手动关闭进程
    )
)
goto :eof

:End
echo.
echo 按任意键继续...
pause >nul