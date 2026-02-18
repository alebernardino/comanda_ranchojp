from fastapi import APIRouter, HTTPException, Depends
from typing import List
import sqlite3

from app.database.dependencies import get_db
from app.models.pagamento import PagamentoCreate, PagamentoResponse

router = APIRouter(tags=["Pagamentos"])


@router.get(
    "/comandas/{numero}/pagamentos",
    response_model=List[PagamentoResponse]
)
def listar_pagamentos(numero: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    cursor.execute(
        """
        SELECT id, forma, valor, detalhe, criado_em
        FROM pagamentos
        WHERE comanda_id = ?
        ORDER BY criado_em
        """,
        (comanda["id"],),
    )
    rows = cursor.fetchall()

    return [dict(r) for r in rows]


@router.post(
    "/comandas/{numero}/pagamentos",
    response_model=PagamentoResponse
)
def adicionar_pagamento(numero: int, pagamento: PagamentoCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    if comanda["status"] != "aberta":
        raise HTTPException(
            status_code=400,
            detail="Comanda já finalizada"
        )

    cursor.execute(
        """
        INSERT INTO pagamentos (comanda_id, forma, valor, detalhe)
        VALUES (?, ?, ?, ?)
        """,
        (
            comanda["id"],
            pagamento.forma,
            pagamento.valor,
            pagamento.detalhe,
        ),
    )
    
    # Se houver detalhamento de itens pagos, atualiza a tabela itens_comanda
    itens_pagamento = pagamento.itens if isinstance(pagamento.itens, list) else []
    if itens_pagamento:
        for item_pago in itens_pagamento:
            if item_pago is None:
                continue
            if isinstance(item_pago, dict):
                item_id = item_pago.get("id")
                quantidade = item_pago.get("quantidade")
            else:
                item_id = getattr(item_pago, "id", None)
                quantidade = getattr(item_pago, "quantidade", None)

            try:
                item_id = int(item_id)
                quantidade = float(quantidade)
            except (TypeError, ValueError):
                continue

            if item_id <= 0 or quantidade <= 0:
                continue

            cursor.execute(
                """
                UPDATE itens_comanda
                SET quantidade_paga = quantidade_paga + ?
                WHERE id = ?
                """,
                (quantidade, item_id),
            )
            cursor.execute(
                """
                UPDATE estoque_produtos
                SET quantidade = quantidade - ?,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE produto_id = (
                    SELECT p.id FROM produtos p
                    JOIN itens_comanda ic ON ic.codigo = p.codigo
                    WHERE ic.id = ?
                )
                """,
                (quantidade, item_id),
            )
            cursor.execute(
                """
                INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, motivo, origem, referencia)
                SELECT p.id, 'saida', ?, 'Pagamento de comanda', 'comanda', ?
                FROM produtos p
                JOIN itens_comanda ic ON ic.codigo = p.codigo
                WHERE ic.id = ?
                """,
                (quantidade, f"comanda:{numero}", item_id),
            )
            
    pagamento_id = cursor.lastrowid
    db.commit()

    cursor.execute("SELECT * FROM pagamentos WHERE id = ?", (pagamento_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Falha ao confirmar pagamento")

    return dict(row)


@router.put(
    "/pagamentos/{pagamento_id}",
    response_model=PagamentoResponse
)
def atualizar_pagamento(pagamento_id: int, pagamento: PagamentoCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    cursor.execute(
        "SELECT id FROM pagamentos WHERE id = ?",
        (pagamento_id,),
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    cursor.execute(
        """
        UPDATE pagamentos
        SET forma = ?, valor = ?, detalhe = ?
        WHERE id = ?
        """,
        (
            pagamento.forma,
            pagamento.valor,
            pagamento.detalhe,
            pagamento_id,
        ),
    )
    db.commit()

    cursor.execute("SELECT * FROM pagamentos WHERE id = ?", (pagamento_id,))
    updated = cursor.fetchone()

    return dict(updated)


@router.delete("/pagamentos/{pagamento_id}")
def remover_pagamento(pagamento_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    cursor.execute(
        "SELECT id FROM pagamentos WHERE id = ?",
        (pagamento_id,),
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    cursor.execute(
        "DELETE FROM pagamentos WHERE id = ?",
        (pagamento_id,),
    )
    db.commit()

    return {"status": "ok"}
