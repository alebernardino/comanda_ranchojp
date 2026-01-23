@echo off
setlocal
set SCRIPT_DIR=%~dp0
set VBS=%SCRIPT_DIR%start-comandafacil.vbs
set ICON=%SCRIPT_DIR%..\frontend\assents\img\logo-comandafacil.png
set DESKTOP=%USERPROFILE%\Desktop
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$W = New-Object -ComObject WScript.Shell; `
$S = $W.CreateShortcut('%DESKTOP%\\ComandaFacil.lnk'); `
$S.TargetPath = '%VBS%'; `
$S.WorkingDirectory = '%SCRIPT_DIR%'; `
$S.IconLocation = '%ICON%'; `
$S.Save()"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$W = New-Object -ComObject WScript.Shell; `
$S = $W.CreateShortcut('%STARTMENU%\\ComandaFacil.lnk'); `
$S.TargetPath = '%VBS%'; `
$S.WorkingDirectory = '%SCRIPT_DIR%'; `
$S.IconLocation = '%ICON%'; `
$S.Save()"

endlocal
