@echo off
REM =====================================================
REM COMANDA RANCHO JP - Teste de Impressora (Windows)
REM =====================================================

setlocal
set BASEDIR=%~dp0..

cd /d "%BASEDIR%\backend"

set "ARGS=%*"
if "%~1"=="" set "ARGS=--mode serial --port COM3 --baudrate 9600"

IF EXIST ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe .\scripts\testar_impressora.py %ARGS%
) ELSE (
    python .\scripts\testar_impressora.py %ARGS%
)

pause
endlocal
