from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
import sqlite3

from app.database.dependencies import get_db
from app.models.cliente import ClienteResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    busca: str | None = Query(default=None, description="Busca por nome ou telefone"),
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.cursor()
    if busca:
        like = f"%{busca.strip()}%"
        cursor.execute(
            """
            SELECT id, nome, telefone, criado_em, atualizado_em
            FROM clientes
            WHERE nome LIKE ? OR telefone LIKE ?
            ORDER BY nome
            """,
            (like, like),
        )
    else:
        cursor.execute(
            """
            SELECT id, nome, telefone, criado_em, atualizado_em
            FROM clientes
            ORDER BY nome
            """
        )
    rows = cursor.fetchall()
    return [dict(r) for r in rows]


@router.get("/por-telefone", response_model=ClienteResponse)
def buscar_cliente_por_telefone(
    telefone: str = Query(..., description="Telefone do cliente"),
    db: sqlite3.Connection = Depends(get_db),
):
    telefone = telefone.strip()
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT id, nome, telefone, criado_em, atualizado_em
        FROM clientes
        WHERE telefone = ?
        """,
        (telefone,),
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return dict(row)
