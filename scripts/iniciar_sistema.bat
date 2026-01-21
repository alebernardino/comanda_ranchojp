@echo off
REM =====================================================
REM COMANDA RANCHO JP - Script de Inicialização (Windows)
REM =====================================================

TITLE Comanda Rancho JP - Iniciando...

REM Define o diretório do projeto
SET BASEDIR=%~dp0..

echo.
echo ========================================
echo   COMANDA RANCHO JP - Iniciando...
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

REM Ativa o ambiente virtual
echo [1/4] Ativando ambiente virtual...
cd /d "%BASEDIR%\backend"
IF EXIST ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) ELSE (
    echo [AVISO] Ambiente virtual nao encontrado. Criando...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    IF EXIST "wheels" (
        echo [INFO] Instalando dependencias offline via .\wheels
        pip install --no-index --find-links=.\wheels -r requirements.txt
    ) ELSE (
        pip install -r requirements.txt
    )
)

REM Inicia o backend em segundo plano
echo [2/4] Iniciando backend (porta 8000)...
start /B "" python -m uvicorn main:app --host 127.0.0.1 --port 8000

REM Inicia o frontend em segundo plano
echo [3/4] Iniciando frontend (porta 5500)...
cd /d "%BASEDIR%\frontend"
start /B "" python -m http.server 5500

REM Aguarda os servidores iniciarem
echo [4/4] Aguardando servidores...
timeout /t 3 /nobreak >nul

REM Abre o navegador
echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo   Abrindo navegador...
echo ========================================
echo.

start http://localhost:5500

echo.
echo [INFO] Mantenha esta janela aberta para o sistema funcionar.
echo [INFO] Para encerrar, feche esta janela.
echo.

REM Mantém a janela aberta
:loop
timeout /t 60 /nobreak >nul
goto loop
