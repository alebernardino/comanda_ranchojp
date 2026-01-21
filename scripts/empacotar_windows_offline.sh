#!/bin/bash
# =====================================================
# COMANDA RANCHO JP - Empacotar para Windows (offline)
# =====================================================

set -euo pipefail

BASEDIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$BASEDIR/dist"
ZIPNAME="comanda_ranchojp_windows_offline.zip"

mkdir -p "$OUTDIR"

if ! command -v zip >/dev/null 2>&1; then
  echo "[ERRO] 'zip' nao encontrado. Instale com: sudo apt install zip"
  exit 1
fi

echo "[INFO] Gerando pacote offline em: $OUTDIR/$ZIPNAME"
echo "[INFO] Excluindo banco local: backend/app/database/comanda.db"

cd "$BASEDIR"
zip -r "$OUTDIR/$ZIPNAME" . \
  -x "backend/app/database/comanda.db" \
  -x "backend/.venv/*" \
  -x "**/__pycache__/*" \
  -x "**/*.pyc"

echo "[OK] Pacote criado."
