@echo off
setlocal
set LICENSE_BYPASS=1
cd /d %~dp0\..\backend
call .venv\Scripts\activate.bat
start "ComandaFacil Backend" /min python -m uvicorn main:app --host 127.0.0.1 --port 8000
cd /d %~dp0\..\frontend
start "ComandaFacil Frontend" /min python -m http.server 5500
start "ComandaFacil" http://127.0.0.1:5500
endlocal
