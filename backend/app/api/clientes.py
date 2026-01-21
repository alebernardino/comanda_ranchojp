from fastapi import APIRouter, HTTPException, Depends, Query
import sqlite3

from app.database.dependencies import get_db
from app.models.cliente import ClienteResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])


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
