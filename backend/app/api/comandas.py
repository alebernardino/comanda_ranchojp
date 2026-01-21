from typing import List
from datetime import datetime
import sqlite3

from fastapi import APIRouter, HTTPException, Depends
from app.database.dependencies import get_db, get_comanda_resumo_logic
from app.models.comanda import ComandaCreate, ComandaResponse

router = APIRouter(prefix="/comandas", tags=["Comandas"])

def _normalizar_texto(valor: str | None) -> str | None:
    if not valor:
        return None
    valor = valor.strip()
    return valor if valor else None

def _buscar_nome_cliente(cursor: sqlite3.Cursor, telefone: str | None) -> str | None:
    if not telefone:
        return None
    cursor.execute(
        "SELECT nome FROM clientes WHERE telefone = ?",
        (telefone,),
    )
    row = cursor.fetchone()
    return row["nome"] if row else None

def _upsert_cliente(cursor: sqlite3.Cursor, nome: str | None, telefone: str | None) -> None:
    if not nome or not telefone:
        return
    cursor.execute(
        "SELECT id, nome FROM clientes WHERE telefone = ?",
        (telefone,),
    )
    row = cursor.fetchone()
    if row:
        if nome != row["nome"]:
            cursor.execute(
                "UPDATE clientes SET nome = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?",
                (nome, row["id"]),
            )
        return
    cursor.execute(
        "INSERT INTO clientes (nome, telefone) VALUES (?, ?)",
        (nome, telefone),
    )

def _gerar_codigo_comanda(numero: int) -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{numero}-{timestamp}"


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
    nome = _normalizar_texto(comanda.nome)
    telefone = _normalizar_texto(comanda.telefone)

    if not nome and telefone:
        nome = _buscar_nome_cliente(cursor, telefone)

    # Verifica se já existe uma comanda aberta com esse número
    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ? AND status = 'aberta'",
        (comanda.numero,),
    )
    existente = cursor.fetchone()
    
    if existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe uma comanda ABERTA com esse número"
        )

    # Cria nova
    cursor.execute(
        """
        INSERT INTO comandas (numero, codigo, nome, telefone, status)
        VALUES (?, ?, ?, ?, 'aberta')
        """,
        (comanda.numero, _gerar_codigo_comanda(comanda.numero), nome, telefone),
    )
    _upsert_cliente(cursor, nome, telefone)
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

    # Prioritiza a comanda aberta - se não tiver aberta, retorna 404 para permitir criação de nova
    cursor.execute(
        "SELECT * FROM comandas WHERE numero = ? AND status = 'aberta'", (numero,)
    )
    row = cursor.fetchone()

    if not row:
         raise HTTPException(status_code=404, detail="Comanda não encontrada ou não está aberta")

    return dict(row)

@router.post("/garantir/{numero}", response_model=ComandaResponse)
def garantir_comanda(numero: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    # Verifica se já existe aberta
    cursor.execute(
        "SELECT * FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    row = cursor.fetchone()
    
    if row:
        return dict(row)
    
    # Se não existe, cria uma nova aberta
    cursor.execute(
        "INSERT INTO comandas (numero, codigo, status) VALUES (?, ?, 'aberta')",
        (numero, _gerar_codigo_comanda(numero)),
    )
    db.commit()
    
    cursor.execute(
        "SELECT * FROM comandas WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(cursor.fetchone())


@router.put("/{numero}", response_model=ComandaResponse)
def atualizar_comanda(numero: int, comanda: ComandaCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    nome = _normalizar_texto(comanda.nome)
    telefone = _normalizar_texto(comanda.telefone)

    if not nome and telefone:
        nome = _buscar_nome_cliente(cursor, telefone)

    # Verifica se a comanda existe e está aberta
    cursor.execute(
        "SELECT id FROM comandas WHERE numero = ? AND status = 'aberta'", (numero,)
    )
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Comanda não encontrada ou não está aberta")
    
    comanda_id = row["id"]

    # Atualiza nome e telefone
    cursor.execute(
        """
        UPDATE comandas
        SET nome = ?, telefone = ?
        WHERE id = ?
        """,
        (nome, telefone, comanda_id),
    )
    _upsert_cliente(cursor, nome, telefone)
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
        "SELECT id, status FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda não encontrada ou já finalizada")

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
        raise HTTPException(
            status_code=400,
            detail="Saldo insuficiente para fechar a comanda"
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

    # Buscar comanda (apenas aberta)
    cursor.execute(
        "SELECT id, status FROM comandas WHERE numero = ? AND status = 'aberta'",
        (numero,),
    )
    comanda = cursor.fetchone()

    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda não encontrada ou não está aberta")

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
