@echo off
setlocal
set SCRIPT_DIR=%~dp0
set TARGET=%SCRIPT_DIR%iniciar_sistema.bat
set ICON=%SCRIPT_DIR%..\frontend\assents\img\logo-comandafacil.png
set DESKTOP=%USERPROFILE%\Desktop

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%DESKTOP%\\Comanda Rancho JP.lnk'); $sc.TargetPath = '%TARGET%'; $sc.WorkingDirectory = '%SCRIPT_DIR%'; $sc.IconLocation = '%ICON%'; $sc.Save()"

echo Atalho criado na Area de Trabalho.
pause
endlocal
