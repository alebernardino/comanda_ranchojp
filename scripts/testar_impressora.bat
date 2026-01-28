@echo off
REM =====================================================
REM COMANDA RANCHO JP - Teste de Impressora (Windows)
REM =====================================================

setlocal
set BASEDIR=%~dp0..

cd /d "%BASEDIR%\backend"

IF EXIST ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe .\scripts\testar_impressora.py %*
) ELSE (
    python .\scripts\testar_impressora.py %*
)

pause
endlocal
