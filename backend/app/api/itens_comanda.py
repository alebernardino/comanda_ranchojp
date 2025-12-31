from pydantic import BaseModel
from datetime import datetime

from fastapi import APIRouter, HTTPException
from typing import List

from app.database.connection import get_connection
from app.models.item_comanda import (
    ItemComandaCreate,
    ItemComandaResponse,
)

router = APIRouter(tags=["Itens da Comanda"])

class ItemComandaCreate(BaseModel):
    codigo: str
    descricao: str
    quantidade: float
    valor: float

class ItemComandaResponse(ItemComandaCreate):
    id: int
    subtotal: float
    quantidade_paga: float
    criado_em: datetime

    class Config:
        from_attributes = True

print("FIELDS ItemComandaCreate:", ItemComandaCreate.model_fields)

@router.get(
    "/comandas/{numero}/itens",
    response_model=List[ItemComandaResponse]
)
def listar_itens_da_comanda(numero: int):
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
        SELECT id, codigo, descricao, quantidade, valor, subtotal, quantidade_paga, criado_em
        FROM itens_comanda
        WHERE comanda_id = ?
        ORDER BY criado_em
        """,
        (comanda["id"],),
    )
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


@router.post(
    "/comandas/{numero}/itens",
    response_model=ItemComandaResponse
)
def adicionar_item(numero: int, item: ItemComandaCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Comanda não encontrada ou não está aberta"
        )

    # Verifica se já existe o mesmo produto (mesmo código e valor) na comanda
    cursor.execute(
        """
        SELECT id, quantidade, subtotal 
        FROM itens_comanda 
        WHERE comanda_id = ? AND codigo = ? AND valor = ?
        """,
        (comanda["id"], item.codigo, item.valor),
    )
    item_existente = cursor.fetchone()

    if item_existente:
        nova_quantidade = item_existente["quantidade"] + item.quantidade
        novo_subtotal = nova_quantidade * item.valor
        cursor.execute(
            """
            UPDATE itens_comanda 
            SET quantidade = ?, subtotal = ? 
            WHERE id = ?
            """,
            (nova_quantidade, novo_subtotal, item_existente["id"]),
        )
        item_id = item_existente["id"]
    else:
        subtotal = item.quantidade * item.valor
        cursor.execute(
            """
            INSERT INTO itens_comanda
            (comanda_id, codigo, descricao, quantidade, valor, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                comanda["id"],
                item.codigo,
                item.descricao,
                item.quantidade,
                item.valor,
                subtotal,
            ),
        )
        item_id = cursor.lastrowid

    conn.commit()

    cursor.execute(
        """
        SELECT id, codigo, descricao, quantidade, valor, subtotal, quantidade_paga, criado_em
        FROM itens_comanda
        WHERE id = ?
        """,
        (item_id,),
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row)


@router.put(
    "/itens/{item_id}",
    response_model=ItemComandaResponse
)
def atualizar_item(item_id: int, item: ItemComandaCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM itens_comanda WHERE id = ?",
        (item_id,),
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Item não encontrado")

    subtotal = item.quantidade * item.valor

    cursor.execute(
        """
        UPDATE itens_comanda
        SET codigo = ?, descricao = ?, quantidade = ?, valor = ?, subtotal = ?
        WHERE id = ?
        """,
        (
            item.codigo,
            item.descricao,
            item.quantidade,
            item.valor,
            subtotal,
            item_id,
        ),
    )
    conn.commit()

    cursor.execute(
        """
        SELECT id, codigo, descricao, quantidade, valor, subtotal, quantidade_paga, criado_em
        FROM itens_comanda
        WHERE id = ?
        """,
        (item_id,),
    )
    updated = cursor.fetchone()
    conn.close()

    return dict(updated)


@router.delete("/itens/{item_id}")
def remover_item(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM itens_comanda WHERE id = ?",
        (item_id,),
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Item não encontrado")

    cursor.execute(
        "DELETE FROM itens_comanda WHERE id = ?",
        (item_id,),
    )
    conn.commit()
    conn.close()

    return {"status": "ok"}
