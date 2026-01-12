#!/bin/bash
# Script para criar zip limpo do projeto

# Nome do arquivo de saída
OUTPUT="comanda_ranchojp_limpo.zip"

# Remove zip antigo se existir
rm -f "../$OUTPUT"

# Cria zip excluindo pastas desnecessárias
zip -r "../$OUTPUT" . \
    -x ".git/*" \
    -x "backend/.venv/*" \
    -x "*/__pycache__/*" \
    -x "*.pyc" \
    -x "*.pyo" \
    -x ".env" \
    -x "backend/app/database/comanda.db"

echo "✅ Zip criado: ../$OUTPUT"
echo "📦 Tamanho:"
ls -lh "../$OUTPUT"
