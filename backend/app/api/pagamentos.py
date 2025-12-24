from fastapi import APIRouter, HTTPException
from typing import List

from app.database.connection import get_connection
from app.models.pagamento import PagamentoCreate, PagamentoResponse

router = APIRouter(tags=["Pagamentos"])


@router.get(
    "/comandas/{numero}/pagamentos",
    response_model=List[PagamentoResponse]
)
def listar_pagamentos(numero: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ?",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        conn.close()
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
    conn.close()

    return [dict(r) for r in rows]


@router.post(
    "/comandas/{numero}/pagamentos",
    response_model=PagamentoResponse
)
def adicionar_pagamento(numero: int, pagamento: PagamentoCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ?",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        conn.close()
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    if comanda["status"] != "aberta":
        conn.close()
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
    conn.commit()

    pagamento_id = cursor.lastrowid

    cursor.execute(
        """
        SELECT id, forma, valor, detalhe, criado_em
        FROM pagamentos
        WHERE id = ?
        """,
        (pagamento_id,),
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row)


@router.put(
    "/pagamentos/{pagamento_id}",
    response_model=PagamentoResponse
)
def atualizar_pagamento(pagamento_id: int, pagamento: PagamentoCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM pagamentos WHERE id = ?",
        (pagamento_id,),
    )
    if not cursor.fetchone():
        conn.close()
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
    conn.commit()

    cursor.execute(
        """
        SELECT id, forma, valor, detalhe, criado_em
        FROM pagamentos
        WHERE id = ?
        """,
        (pagamento_id,),
    )
    updated = cursor.fetchone()
    conn.close()

    return dict(updated)


@router.delete("/pagamentos/{pagamento_id}")
def remover_pagamento(pagamento_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM pagamentos WHERE id = ?",
        (pagamento_id,),
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    cursor.execute(
        "DELETE FROM pagamentos WHERE id = ?",
        (pagamento_id,),
    )
    conn.commit()
    conn.close()

    return {"status": "ok"}
