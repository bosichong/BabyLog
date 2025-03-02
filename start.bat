@echo off
chcp 65001

:: 设置工作目录为脚本所在目录
cd /d "%~dp0"

:: 创建桌面快捷方式（如果不存在）
if not exist "%USERPROFILE%\Desktop\BabyLog.lnk" (
    echo 正在创建桌面快捷方式...
    powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%USERPROFILE%\Desktop\BabyLog.lnk'); $SC.TargetPath = '%~f0'; $SC.WorkingDirectory = '%~dp0'; $SC.Description = 'BabyLog 一键启动'; $SC.Save()"
)

:: 启动应用
echo 正在启动BabyLog应用...
node start.js

pause