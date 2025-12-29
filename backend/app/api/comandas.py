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

    return [dict(r) for r in rows]


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
        INSERT INTO comandas (numero, nome, telefone, status)
        VALUES (?, ?, ?, 'aberta')
        """,
        (comanda.numero, comanda.nome, comanda.telefone),
    )
    conn.commit()

    comanda_id = cursor.lastrowid

    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?", (comanda_id,)
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row)


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

    return dict(row)


@router.put("/{numero}", response_model=ComandaResponse)
def atualizar_comanda(numero: int, comanda: ComandaCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Verifica se a comanda existe
    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ?", (numero,)
    )
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Comanda não encontrada")
    
    comanda_id = row["id"]

    # Atualiza nome e telefone
    cursor.execute(
        """
        UPDATE comandas
        SET nome = ?, telefone = ?
        WHERE id = ?
        """,
        (comanda.nome, comanda.telefone, comanda_id),
    )
    conn.commit()

    # Retorna a comanda atualizada
    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?", (comanda_id,)
    )
    updated = cursor.fetchone()
    conn.close()

    return dict(updated)



@router.post("/{numero}/fechar", response_model=ComandaResponse)
def fechar_comanda(numero: int):
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
            detail="Comanda já está finalizada"
        )

    comanda_id = comanda["id"]

    # Total itens
    cursor.execute(
        "SELECT COALESCE(SUM(subtotal), 0) as total_itens FROM itens_comanda WHERE comanda_id = ?",
        (comanda_id,),
    )
    total_itens = cursor.fetchone()["total_itens"]

    # Total pagamentos
    cursor.execute(
        "SELECT COALESCE(SUM(valor), 0) as total_pago FROM pagamentos WHERE comanda_id = ?",
        (comanda_id,),
    )
    total_pago = cursor.fetchone()["total_pago"]

    if total_pago < total_itens:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Pagamento insuficiente para fechar a comanda"
        )

    cursor.execute(
        """
        UPDATE comandas
        SET status = 'finalizada',
            finalizada_em = ?
        WHERE id = ?
        """,
        (datetime.now(), comanda_id),
    )
    conn.commit()

    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?",
        (comanda_id,),
    )
    updated = cursor.fetchone()
    conn.close()

    return dict(updated)


@router.get("/{numero}/resumo")
def resumo_comanda(numero: int):
    conn = get_connection()
    cursor = conn.cursor()

    # Buscar comanda
    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ?",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        conn.close()
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    comanda_id = comanda["id"]

    # Total de itens
    cursor.execute(
        "SELECT COALESCE(SUM(subtotal), 0) as total_itens FROM itens_comanda WHERE comanda_id = ?",
        (comanda_id,),
    )
    total_itens = cursor.fetchone()["total_itens"]

    # Total de pagamentos
    cursor.execute(
        "SELECT COALESCE(SUM(valor), 0) as total_pago FROM pagamentos WHERE comanda_id = ?",
        (comanda_id,),
    )
    total_pago = cursor.fetchone()["total_pago"]

    saldo = total_pago - total_itens

    conn.close()

    return {
        "numero": numero,
        "status": comanda["status"],
        "total_itens": round(total_itens, 2),
        "total_pago": round(total_pago, 2),
        "saldo": round(saldo, 2),
        "pode_fechar": saldo >= 0
    }
