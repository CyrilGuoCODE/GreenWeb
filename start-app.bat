@echo off
setlocal enabledelayedexpansion

echo GreenWeb 启动选项
echo ================
echo 1. 开发模式 (前后端分离)
echo 2. 生产模式 (整合前后端)
echo 3. 仅构建项目
echo 4. 退出
echo.

set /p choice=请选择启动模式 (1-4): 

if "%choice%"=="1" (
    echo 启动开发模式...
    
    :: 检查并关闭占用3000端口的进程
    echo 检查端口占用...
    FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
        echo 发现进程占用端口3000: %%P, 尝试关闭...
        taskkill /F /PID %%P 2>NUL
    )
    
    :: 检查并关闭占用5173端口的进程
    FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') DO (
        echo 发现进程占用端口5173: %%P, 尝试关闭...
        taskkill /F /PID %%P 2>NUL
    )
    
    echo 1. 启动后端服务器...
    start cmd /k "cd /d %~dp0 && npm run server:dev"
    echo 2. 启动前端开发服务器...
    start cmd /k "cd /d %~dp0 && npm run dev"
    echo 服务已启动! 请在浏览器中打开 http://localhost:5173
)

if "%choice%"=="2" (
    echo 启动生产模式...
    
    :: 检查并关闭占用3000端口的进程
    echo 检查端口占用...
    FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
        echo 发现进程占用端口3000: %%P, 尝试关闭...
        taskkill /F /PID %%P 2>NUL
    )
    
    echo 1. 构建前端应用...
    call npm run build
    
    echo 2. 启动整合服务器...
    start cmd /k "cd /d %~dp0 && npm run start"
    
    echo 服务已启动! 请在浏览器中打开 http://localhost:3000
)

if "%choice%"=="3" (
    echo 执行项目构建...
    call npm run build
    echo 构建完成！可以通过 npm run start 启动服务
)

if "%choice%"=="4" (
    echo 退出程序...
    exit /b
)

echo.
pause