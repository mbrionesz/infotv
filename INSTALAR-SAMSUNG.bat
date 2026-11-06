@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -File "%~dp0tools\install-samsung.ps1" %*
set "RESULT=%ERRORLEVEL%"
pause
exit /b %RESULT%
