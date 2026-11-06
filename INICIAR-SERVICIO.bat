@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -File "%~dp0tools\start-companion.ps1" %*
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" pause
exit /b %RESULT%
