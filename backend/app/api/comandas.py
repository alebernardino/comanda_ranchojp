from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from app.database.connection import get_connection
from app.models.comanda import ComandaCreate, ComandaResponse

router = APIRouter(prefix="/comandas", tags=["Comandas"])


@router.get("/", response_model=List[ComandaResponse])
def listar_comandas_abertas():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM comandas WHERE status = 'aberta' ORDER BY numero"
    )
    rows = cursor.fetchall()
    conn.close()

    return rows


@router.post("/", response_model=ComandaResponse)
def abrir_comanda(comanda: ComandaCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Verifica se número da comanda já existe
    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ?", (comanda.numero,)
    )
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Já existe comanda com esse número"
        )

    cursor.execute(
        """
        INSERT INTO comandas (numero, nome, status)
        VALUES (?, ?, 'aberta')
        """,
        (comanda.numero, comanda.nome),
    )
    conn.commit()

    comanda_id = cursor.lastrowid

    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?", (comanda_id,)
    )
    row = cursor.fetchone()
    conn.close()

    return row


@router.get("/{numero}", response_model=ComandaResponse)
def buscar_comanda_por_numero(numero: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM comandas WHERE numero = ?", (numero,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    return row


@router.post("/{numero}/fechar", response_model=ComandaResponse)
def fechar_comanda(numero: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Comanda não encontrada ou já finalizada"
        )

    cursor.execute(
        """
        UPDATE comandas
        SET status = 'finalizada',
            finalizada_em = ?
        WHERE numero = ?
        """,
        (datetime.now(), numero),
    )
    conn.commit()

    cursor.execute(
        "SELECT * FROM comandas WHERE numero = ?", (numero,)
    )
    updated = cursor.fetchone()
    conn.close()

    return updated
