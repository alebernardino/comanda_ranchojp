from fastapi import APIRouter, Depends, Query
import sqlite3
from typing import List, Optional
from app.database.dependencies import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])

@router.get("/vendas")
def relatorio_vendas(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    query = """
        SELECT 
            i.codigo,
            i.descricao,
            SUM(i.quantidade) as total_qtd,
            SUM(i.subtotal) as total_valor
        FROM itens_comanda i
        JOIN comandas c ON i.comanda_id = c.id
        WHERE c.status = 'finalizada'
    """
    params = []
    if data_inicio:
        query += " AND c.finalizada_em >= ?"
        params.append(data_inicio)
    if data_fim:
        query += " AND c.finalizada_em <= ?"
        params.append(data_fim)
        
    query += " GROUP BY i.codigo, i.descricao ORDER BY total_valor DESC"
    
    cursor = db.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

@router.get("/fluxo-caixa")
def fluxo_caixa(
    periodo: str = "dia", # dia, semana, mes, ano
    db: sqlite3.Connection = Depends(get_db)
):
    # Formatos de agrupamento SQLite
    formats = {
        "dia": "%Y-%m-%d",
        "semana": "%Y-%W",
        "mes": "%Y-%m",
        "ano": "%Y"
    }
    fmt = formats.get(periodo, "%Y-%m-%d")

    # Entradas (Pagamentos de Comandas)
    query_entradas = f"""
        SELECT strftime('{fmt}', criado_em) as tempo, SUM(valor) as total
        FROM pagamentos
        GROUP BY tempo
    """
    
    # Saídas (Pagamentos Gerais)
    query_saidas = f"""
        SELECT strftime('{fmt}', data) as tempo, SUM(valor) as total
        FROM pagamentos_gerais
        WHERE pago = 1
        GROUP BY tempo
    """

    cursor = db.cursor()
    
    cursor.execute(query_entradas)
    entradas = {row["tempo"]: row["total"] for row in cursor.fetchall()}
    
    cursor.execute(query_saidas)
    saidas = {row["tempo"]: row["total"] for row in cursor.fetchall()}
    
    # Unificar chaves de tempo e classificar
    todos_tempos = sorted(list(set(entradas.keys()) | set(saidas.keys())))
    
    resultado = []
    for t in todos_tempos:
        e = entradas.get(t, 0)
        s = saidas.get(t, 0)
        resultado.append({
            "periodo": t,
            "entradas": e,
            "saidas": s,
            "saldo": e - s
        })
        
    return resultado
