@echo off
chcp 65001 >nul
echo ==============================================
echo   NEO-ZEN 数字禅境 —— Windows exe 打包脚本
echo ==============================================
echo.

pip install -r requirements.txt pyinstaller
if errorlevel 1 (
    echo 依赖安装失败，请检查网络或 Python 环境。
    pause
    exit /b 1
)

pyinstaller --noconfirm --onefile --windowed --name NeoZen ^
    --hidden-import glcontext ^
    main.py

echo.
echo ==============================================
echo   完成！exe 位于 dist\NeoZen.exe
echo   如需播放 4K 实拍视频：在 NeoZen.exe 同级
echo   目录新建 videos\ 文件夹，放入 mp4 即可。
echo ==============================================
pause
