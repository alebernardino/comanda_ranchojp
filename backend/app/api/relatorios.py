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
    periodo: str = "dia", # dia, semana, mes
    busca: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    # Formatos de agrupamento SQLite
    fmt = "%Y-%m-%d"
    tempo_col = "date(c.finalizada_em)"
    if periodo == "semana":
        tempo_col = "date(c.finalizada_em, 'weekday 1', '-7 days')"
    elif periodo == "mes":
        tempo_col = "strftime('%Y-%m', c.finalizada_em)"

    where_clause = "WHERE c.status = 'finalizada'"
    params = []
    if data_inicio:
        data_inicio = data_inicio.replace("T", " ")
        where_clause += " AND c.finalizada_em >= ?"
        params.append(data_inicio)
    if data_fim:
        data_fim = data_fim.replace("T", " ")
        where_clause += " AND c.finalizada_em <= ?"
        params.append(data_fim)
    
    if busca:
        where_clause += " AND (i.descricao LIKE ? OR i.codigo LIKE ?)"
        params.append(f"%{busca}%")
        params.append(f"%{busca}%")

    cursor = db.cursor()

    # 1. Geral (Vendas por Produto)
    query_geral = f"""
        SELECT 
            i.codigo,
            i.descricao,
            SUM(i.quantidade) as total_qtd,
            SUM(i.subtotal) as total_valor
        FROM itens_comanda i
        JOIN comandas c ON i.comanda_id = c.id
        {where_clause}
        GROUP BY i.codigo, i.descricao 
        ORDER BY total_valor DESC
    """
    cursor.execute(query_geral, params)
    geral = [dict(r) for r in cursor.fetchall()]

    # 2. Agrupamento (Vendas por Período para o Gráfico)
    query_temporal = f"""
        SELECT 
            {tempo_col} as tempo,
            SUM(i.subtotal) as total_valor,
            SUM(i.quantidade) as total_qtd
        FROM itens_comanda i
        JOIN comandas c ON i.comanda_id = c.id
        {where_clause}
        GROUP BY tempo
        ORDER BY tempo
    """
    cursor.execute(query_temporal, params)
    temporal = [dict(r) for r in cursor.fetchall()]

    # 3. Analítico (Lançamentos Individuais)
    query_analitico = f"""
        SELECT 
            c.finalizada_em as data,
            c.numero as comanda_numero,
            i.descricao,
            i.quantidade,
            i.subtotal as valor
        FROM itens_comanda i
        JOIN comandas c ON i.comanda_id = c.id
        {where_clause}
        ORDER BY data DESC
    """
    cursor.execute(query_analitico, params)
    analitico = [dict(r) for r in cursor.fetchall()]

    # 4. Por Comanda (Resumo de cada comanda com formas de pagamento)
    # Precisamos de um sub-select para o total (já que não há coluna total em comandas)
    query_comandas_base = f"""
        SELECT 
            c.id,
            c.finalizada_em as data,
            c.numero,
            (SELECT COALESCE(SUM(subtotal), 0) FROM itens_comanda WHERE comanda_id = c.id) as total,
            GROUP_CONCAT(DISTINCT p.forma) as formas
        FROM comandas c
        LEFT JOIN pagamentos p ON c.id = p.comanda_id
        {"JOIN itens_comanda i ON c.id = i.comanda_id" if busca else ""}
        {where_clause}
        GROUP BY c.id
        HAVING total > 0
        ORDER BY data DESC
    """
    
    cursor.execute(query_comandas_base, params)
    comandas_vendas = [dict(r) for r in cursor.fetchall()]

    # 5. Fechamento (Resumo de pagamentos por forma)
    # Importante: o filtro de busca de produto (i.descricao) não deve afetar o fechamento de caixa
    # Então criamos um where_clause específico apenas com as datas
    where_caixa = "WHERE c.status = 'finalizada'"
    params_caixa = []
    if data_inicio:
        where_caixa += " AND c.finalizada_em >= ?"
        params_caixa.append(data_inicio)
    if data_fim:
        where_caixa += " AND c.finalizada_em <= ?"
        params_caixa.append(data_fim)

    query_fechamento = f"""
        SELECT 
            p.forma,
            SUM(p.valor) as total
        FROM pagamentos p
        JOIN comandas c ON p.comanda_id = c.id
        {where_caixa}
        GROUP BY p.forma
        ORDER BY total DESC
    """
    cursor.execute(query_fechamento, params_caixa)
    fechamento = [dict(r) for r in cursor.fetchall()]

    # 6. Resumo de Pagamentos Efetuados (Saídas/Despesas)
    # Usamos o mesmo filtro de data do caixa
    where_saidas = "WHERE 1=1"
    params_saidas = []
    if data_inicio:
        where_saidas += " AND data >= ?"
        params_saidas.append(data_inicio)
    if data_fim:
        where_saidas += " AND data <= ?"
        params_saidas.append(data_fim)

    query_saidas_resumo = f"""
        SELECT 
            nome as fornecedor,
            SUM(valor) as total
        FROM pagamentos_gerais
        {where_saidas}
        GROUP BY nome
        ORDER BY total DESC
    """
    cursor.execute(query_saidas_resumo, params_saidas)
    saidas_resumo = [dict(r) for r in cursor.fetchall()]

    return {
        "geral": geral,
        "temporal": temporal,
        "analitico": analitico,
        "comandas": comandas_vendas,
        "fechamento": fechamento,
        "saidas": saidas_resumo
    }

@router.get("/fluxo-caixa")
def fluxo_caixa(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    periodo: str = "dia", # dia, semana, mes
    db: sqlite3.Connection = Depends(get_db)
):
    # Formatos de agrupamento SQLite
    formats = {
        "dia": "%Y-%m-%d",
        "semana": "%Y-%W",
        "mes": "%Y-%m"
    }
    fmt = formats.get(periodo, "%Y-%m-%d")

    # 1. Filtro de Datas para Resumo e Gráfico
    where_entradas = "WHERE 1=1"
    where_saidas = "WHERE pago = 1"
    params = []
    if data_inicio:
        data_inicio = data_inicio.replace("T", " ")
        where_entradas += " AND criado_em >= ?"
        where_saidas += " AND data >= ?"
        params.append(data_inicio)
    if data_fim:
        data_fim = data_fim.replace("T", " ")
        where_entradas += " AND criado_em <= ?"
        where_saidas += " AND data <= ?"
        params.append(data_fim)

    fmt = "%Y-%m-%d"
    tempo_col_entradas = f"strftime('{fmt}', criado_em)"
    tempo_col_saidas = f"strftime('{fmt}', data)"

    if periodo == "semana":
        tempo_col_entradas = "date(criado_em, 'weekday 1', '-7 days')"
        tempo_col_saidas = "date(data, 'weekday 1', '-7 days')"
    elif periodo == "mes":
        tempo_col_entradas = "strftime('%Y-%m', criado_em)"
        tempo_col_saidas = "strftime('%Y-%m', data)"

    # Gráfico do período
    query_grafico_entradas = f"SELECT {tempo_col_entradas} as tempo, SUM(valor) as total FROM pagamentos {where_entradas} GROUP BY tempo"
    query_grafico_saidas = f"SELECT {tempo_col_saidas} as tempo, SUM(valor) as total FROM pagamentos_gerais {where_saidas} GROUP BY tempo"

    # Dados para Pivot (Geral)
    # Entradas: Periodo x Forma
    query_pivot_entradas = f"SELECT {tempo_col_entradas} as tempo, forma, SUM(valor) as total FROM pagamentos {where_entradas} GROUP BY tempo, forma"
    
    # Saídas: Periodo x Recebedor (Nome)
    query_pivot_saidas = f"SELECT {tempo_col_saidas} as tempo, nome, SUM(valor) as total FROM pagamentos_gerais {where_saidas} GROUP BY tempo, nome"

    # Analítico (Lançamentos Individuais)
    # Entradas: data, forma (como servico), valor (nome como 'Venda')
    query_analitico_entradas = f"""
        SELECT criado_em as data, 'Venda de Comanda' as nome, forma as servico, valor 
        FROM pagamentos {where_entradas} 
        ORDER BY data DESC
    """
    
    # Saídas: data, nome, item_servico, valor
    query_analitico_saidas = f"""
        SELECT data, nome, item_servico as servico, valor 
        FROM pagamentos_gerais {where_saidas} 
        ORDER BY data DESC
    """

    cursor = db.cursor()
    
    # Executar resumo Pivot
    cursor.execute(query_pivot_entradas, params)
    pivot_entradas = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute(query_pivot_saidas, params)
    pivot_saidas = [dict(r) for r in cursor.fetchall()]

    # Executar analítico
    cursor.execute(query_analitico_entradas, params)
    analitico_entradas = [dict(r) for r in cursor.fetchall()]

    cursor.execute(query_analitico_saidas, params)
    analitico_saidas = [dict(r) for r in cursor.fetchall()]

    # NOVO: Fechamento (Resumo por método para o período todo)
    # Entradas
    query_fech_entradas = f"SELECT forma, SUM(valor) as total FROM pagamentos {where_entradas} GROUP BY forma ORDER BY total DESC"
    cursor.execute(query_fech_entradas, params)
    fechamento_entradas = [dict(r) for r in cursor.fetchall()]

    # Saídas
    query_fech_saidas = f"SELECT forma_pagamento as forma, SUM(valor) as total FROM pagamentos_gerais {where_saidas} GROUP BY forma ORDER BY total DESC"
    cursor.execute(query_fech_saidas, params)
    fechamento_saidas = [dict(r) for r in cursor.fetchall()]
    
    return {
        "pivot_entradas": pivot_entradas,
        "pivot_saidas": pivot_saidas,
        "analitico_entradas": analitico_entradas,
        "analitico_saidas": analitico_saidas,
        "fechamento_entradas": fechamento_entradas,
        "fechamento_saidas": fechamento_saidas
    }
