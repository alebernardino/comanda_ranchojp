@echo off
REM =====================================================
REM COMANDA RANCHO JP - Zerar banco (Windows)
REM =====================================================

TITLE Comanda Rancho JP - Zerar Banco

SET BASEDIR=%~dp0..
SET DBPATH=%BASEDIR%\backend\app\database\comanda.db

echo.
echo ========================================
echo   Zerando banco de dados (comanda.db)
echo ========================================
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERRO] Python nao encontrado!
    echo Por favor, instale o Python 3.10+
    pause
    exit /b 1
)

REM Remove o banco existente, se houver
IF EXIST "%DBPATH%" (
    del /f /q "%DBPATH%"
)

REM Recria o schema vazio
cd /d "%BASEDIR%\backend"
python -c "from app.database.init_db import init_db; init_db(); print('Banco zerado com sucesso.')"

echo.
echo [INFO] Banco zerado. Pode iniciar o sistema normalmente.
echo.
pause
