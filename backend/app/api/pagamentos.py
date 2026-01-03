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
        "SELECT id FROM comandas WHERE numero = ?",
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
        "SELECT id, status FROM comandas WHERE numero = ?",
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
    if pagamento.itens:
        for item_pago in pagamento.itens:
            cursor.execute(
                """
                UPDATE itens_comanda
                SET quantidade_paga = quantidade_paga + ?
                WHERE id = ?
                """,
                (item_pago["quantidade"], item_pago["id"]),
            )
            
    pagamento_id = cursor.lastrowid
    db.commit()

    cursor.execute("SELECT * FROM pagamentos WHERE id = ?", (pagamento_id,))
    row = cursor.fetchone()

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
