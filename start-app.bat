@echo off
setlocal enabledelayedexpansion

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Detected that the current user does not have administrator privileges, requesting administrator privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
    exit /b
)

echo GreenWeb Starting...
echo.

:: 检查并关闭占用3000端口的进程
echo Checking port occupancy...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
    echo Found process occupying port 3000: %%P, trying to close...
    taskkill /F /PID %%P 2>NUL
    if !errorlevel! equ 0 (
        echo Successfully closed the process occupying port 3000
    ) else (
        echo Failed to close the process, please manually close the application occupying port 3000
    )
)

:: 检查并关闭占用5173端口的进程
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') DO (
    echo Found process occupying port 5173: %%P, trying to close...
    taskkill /F /PID %%P 2>NUL
    if !errorlevel! equ 0 (
        echo Successfully closed the process occupying port 5173
    ) else (
        echo Failed to close the process, please manually close the application occupying port 5173
    )
)

echo.
echo 1. Starting backend server...
start cmd /k "cd /d %~dp0 && npm run server:dev"
echo.
echo 2. Starting frontend development server...
start cmd /k "cd /d %~dp0 && npm run dev"
echo.
echo Service started! Please open http://localhost:5173 in your browser
echo.
pause