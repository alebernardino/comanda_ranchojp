#!/bin/bash
# =====================================================
# COMANDA RANCHO JP - Script de Inicialização (Linux)
# =====================================================

BASEDIR="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "========================================"
echo "  COMANDA RANCHO JP - Iniciando..."
echo "========================================"
echo ""

# Verifica se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "[ERRO] Python3 não encontrado!"
    echo "Instale com: sudo apt install python3 python3-venv python3-pip"
    exit 1
fi

# Ativa o ambiente virtual
echo "[1/4] Ativando ambiente virtual..."
cd "$BASEDIR/backend"

if [ ! -d ".venv" ]; then
    echo "[AVISO] Ambiente virtual não encontrado. Criando..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# Inicia o backend em segundo plano
echo "[2/4] Iniciando backend (porta 8000)..."
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Inicia o frontend em segundo plano
echo "[3/4] Iniciando frontend (porta 5500)..."
cd "$BASEDIR/frontend"
python3 -m http.server 5500 &
FRONTEND_PID=$!

# Aguarda os servidores iniciarem
echo "[4/4] Aguardando servidores..."
sleep 3

echo ""
echo "========================================"
echo "  Sistema iniciado com sucesso!"
echo "  Abrindo navegador..."
echo "========================================"
echo ""

# Abre o navegador
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5500
elif command -v gnome-open &> /dev/null; then
    gnome-open http://localhost:5500
elif command -v open &> /dev/null; then
    open http://localhost:5500
fi

echo ""
echo "[INFO] Backend PID: $BACKEND_PID"
echo "[INFO] Frontend PID: $FRONTEND_PID"
echo "[INFO] Para encerrar: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Função para encerrar processos ao sair
cleanup() {
    echo ""
    echo "[INFO] Encerrando sistema..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "[INFO] Sistema encerrado."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Mantém o script rodando
echo "[INFO] Pressione Ctrl+C para encerrar o sistema."
wait
