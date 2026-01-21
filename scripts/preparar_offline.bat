@echo off
REM =====================================================
REM COMANDA RANCHO JP - Preparar dependencias offline (Windows)
REM =====================================================

SET BASEDIR=%~dp0..

echo.
echo ========================================
echo   COMANDA RANCHO JP - Offline
echo ========================================
echo.

REM Verifica se Python esta instalado
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERRO] Python nao encontrado!
    echo Instale o Python 3.10+ e tente novamente.
    pause
    exit /b 1
)

cd /d "%BASEDIR%\backend"

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo [INFO] Criando ambiente virtual...
    python -m venv .venv
)

call .venv\Scripts\activate.bat

echo [INFO] Baixando dependencias para .\wheels ...
pip download -r requirements.txt -d wheels

echo.
echo [OK] Pacote offline pronto em backend\wheels
echo.
pause
