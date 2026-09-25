@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8099

echo ============================================
echo   中秋祝福页 - 本地服务器
echo   地址: http://127.0.0.1:%PORT%/
echo   关闭本窗口或按 Ctrl+C 即可停止服务
echo ============================================
echo.

start "moon-server" /min cmd /c "node server.js %PORT%"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"

echo 服务已在后台窗口运行，浏览器已打开。
echo 如需停止：关闭标题为 "moon-server" 的窗口。
pause >nul
