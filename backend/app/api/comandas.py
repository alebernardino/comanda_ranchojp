from typing import List
from datetime import datetime
import sqlite3

from fastapi import APIRouter, HTTPException, Depends
from app.database.dependencies import get_db, get_comanda_resumo_logic
from app.models.comanda import ComandaCreate, ComandaResponse

router = APIRouter(prefix="/comandas", tags=["Comandas"])


@router.get("/", response_model=List[ComandaResponse])
def listar_comandas_abertas(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Só considera "aberta" (ocupada no grid) se tiver nome, telefone ou itens
    cursor.execute(
        """
        SELECT c.* 
        FROM comandas c
        WHERE c.status = 'aberta'
        AND (
            (c.nome IS NOT NULL AND c.nome != '')
            OR (c.telefone IS NOT NULL AND c.telefone != '')
            OR EXISTS (SELECT 1 FROM itens_comanda ic WHERE ic.comanda_id = c.id)
        )
        ORDER BY c.numero
        """
    )
    rows = cursor.fetchall()

    return [dict(r) for r in rows]


@router.post("/", response_model=ComandaResponse)
def abrir_comanda(comanda: ComandaCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Verifica se número da comanda já existe
    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ?", (comanda.numero,)
    )
    existente = cursor.fetchone()
    
    if existente:
        if existente["status"] == "aberta":
            raise HTTPException(
                status_code=400,
                detail="Já existe uma comanda ABERTA com esse número"
            )
        else:
            # Reabre a comanda existente (finalizada)
            comanda_id = existente["id"]
            
            # Limpa itens e pagamentos antigos
            cursor.execute("DELETE FROM itens_comanda WHERE comanda_id = ?", (comanda_id,))
            cursor.execute("DELETE FROM pagamentos WHERE comanda_id = ?", (comanda_id,))
            
            # Reset status e dados
            cursor.execute(
                """
                UPDATE comandas 
                SET status = 'aberta', nome = ?, telefone = ?, finalizada_em = NULL, criada_em = ?
                WHERE id = ?
                """,
                (comanda.nome, comanda.telefone, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), comanda_id)
            )
            db.commit()
            
            cursor.execute("SELECT * FROM comandas WHERE id = ?", (comanda_id,))
            row = cursor.fetchone()
            return dict(row)

    # Cria nova
    cursor.execute(
        """
        INSERT INTO comandas (numero, nome, telefone, status)
        VALUES (?, ?, ?, 'aberta')
        """,
        (comanda.numero, comanda.nome, comanda.telefone),
    )
    db.commit()

    comanda_id = cursor.lastrowid

    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?", (comanda_id,)
    )
    row = cursor.fetchone()

    return dict(row)


@router.get("/{numero}", response_model=ComandaResponse)
def buscar_comanda_por_numero(numero: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    cursor.execute(
        "SELECT * FROM comandas WHERE numero = ?", (numero,)
    )
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    return dict(row)


@router.put("/{numero}", response_model=ComandaResponse)
def atualizar_comanda(numero: int, comanda: ComandaCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Verifica se a comanda existe
    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ?", (numero,)
    )
    row = cursor.fetchone()
    
    if not row:
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
    db.commit()

    # Retorna a comanda atualizada
    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?", (comanda_id,)
    )
    updated = cursor.fetchone()

    return dict(updated)



@router.post("/{numero}/fechar", response_model=ComandaResponse)
def fechar_comanda(numero: int, db: sqlite3.Connection = Depends(get_db)):
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

    cursor.execute(
        """
        UPDATE comandas
        SET status = 'finalizada',
            finalizada_em = ?
        WHERE id = ?
        """,
        (datetime.now(), comanda_id),
    )
    db.commit()

    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?",
        (comanda_id,),
    )
    updated = cursor.fetchone()

    return dict(updated)


@router.get("/{numero}/resumo")
def resumo_comanda(numero: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Buscar comanda
    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ?",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda não encontrada")

    comanda_id = comanda["id"]

    total_itens, total_pago, saldo = get_comanda_resumo_logic(cursor, comanda_id)

    return {
        "numero": numero,
        "status": comanda["status"],
        "total_itens": round(total_itens, 2),
        "total_pago": round(total_pago, 2),
        "saldo": round(saldo, 2),
        "pode_fechar": saldo >= 0
    }
