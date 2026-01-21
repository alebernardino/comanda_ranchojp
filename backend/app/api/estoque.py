from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import sqlite3

from app.database.dependencies import get_db
from app.models.estoque import EstoqueProdutoResponse, EstoqueMovimentoCreate, EstoqueMovimentoResponse

router = APIRouter(prefix="/estoque", tags=["Estoque"])


def _registrar_movimento(
    cursor: sqlite3.Cursor,
    produto_id: int,
    tipo: str,
    quantidade: float,
    motivo: Optional[str],
    origem: Optional[str],
    referencia: Optional[str],
) -> None:
    cursor.execute(
        """
        INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, motivo, origem, referencia)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (produto_id, tipo, quantidade, motivo, origem, referencia),
    )


@router.get("/", response_model=List[EstoqueProdutoResponse])
def listar_estoque(
    busca: Optional[str] = Query(default=None, description="Busca por codigo ou descricao"),
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.cursor()
    if busca:
        like = f"%{busca.strip()}%"
        cursor.execute(
            """
            SELECT ep.produto_id, p.codigo, p.descricao, ep.quantidade, ep.minimo, ep.atualizado_em
            FROM estoque_produtos ep
            JOIN produtos p ON p.id = ep.produto_id
            WHERE p.codigo LIKE ? OR p.descricao LIKE ?
            ORDER BY p.descricao
            """,
            (like, like),
        )
    else:
        cursor.execute(
            """
            SELECT ep.produto_id, p.codigo, p.descricao, ep.quantidade, ep.minimo, ep.atualizado_em
            FROM estoque_produtos ep
            JOIN produtos p ON p.id = ep.produto_id
            ORDER BY p.descricao
            """
        )
    rows = cursor.fetchall()
    return [dict(r) for r in rows]


@router.post("/entrada", response_model=EstoqueMovimentoResponse)
def entrada_estoque(
    mov: EstoqueMovimentoCreate,
    db: sqlite3.Connection = Depends(get_db),
):
    if mov.quantidade <= 0:
        raise HTTPException(status_code=400, detail="Quantidade deve ser maior que zero")
    cursor = db.cursor()
    cursor.execute("SELECT id FROM produtos WHERE id = ?", (mov.produto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    cursor.execute(
        "UPDATE estoque_produtos SET quantidade = quantidade + ?, atualizado_em = CURRENT_TIMESTAMP WHERE produto_id = ?",
        (mov.quantidade, mov.produto_id),
    )
    _registrar_movimento(cursor, mov.produto_id, "entrada", mov.quantidade, mov.motivo, mov.origem or "compra", mov.referencia)
    db.commit()

    cursor.execute(
        "SELECT id, produto_id, tipo, quantidade, motivo, origem, referencia, criado_em FROM estoque_movimentos WHERE id = ?",
        (cursor.lastrowid,),
    )
    return dict(cursor.fetchone())


@router.post("/saida", response_model=EstoqueMovimentoResponse)
def saida_estoque(
    mov: EstoqueMovimentoCreate,
    db: sqlite3.Connection = Depends(get_db),
):
    if mov.quantidade <= 0:
        raise HTTPException(status_code=400, detail="Quantidade deve ser maior que zero")
    cursor = db.cursor()
    cursor.execute("SELECT id FROM produtos WHERE id = ?", (mov.produto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    cursor.execute(
        "UPDATE estoque_produtos SET quantidade = quantidade - ?, atualizado_em = CURRENT_TIMESTAMP WHERE produto_id = ?",
        (mov.quantidade, mov.produto_id),
    )
    _registrar_movimento(cursor, mov.produto_id, "saida", mov.quantidade, mov.motivo, mov.origem or "avulso", mov.referencia)
    db.commit()

    cursor.execute(
        "SELECT id, produto_id, tipo, quantidade, motivo, origem, referencia, criado_em FROM estoque_movimentos WHERE id = ?",
        (cursor.lastrowid,),
    )
    return dict(cursor.fetchone())


@router.post("/ajuste", response_model=EstoqueMovimentoResponse)
def ajuste_estoque(
    mov: EstoqueMovimentoCreate,
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM produtos WHERE id = ?", (mov.produto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    cursor.execute(
        "UPDATE estoque_produtos SET quantidade = ?, atualizado_em = CURRENT_TIMESTAMP WHERE produto_id = ?",
        (mov.quantidade, mov.produto_id),
    )
    _registrar_movimento(cursor, mov.produto_id, "ajuste", mov.quantidade, mov.motivo, mov.origem or "ajuste", mov.referencia)
    db.commit()

    cursor.execute(
        "SELECT id, produto_id, tipo, quantidade, motivo, origem, referencia, criado_em FROM estoque_movimentos WHERE id = ?",
        (cursor.lastrowid,),
    )
    return dict(cursor.fetchone())


@router.put("/minimo/{produto_id}")
def atualizar_minimo(
    produto_id: int,
    minimo: float,
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM estoque_produtos WHERE produto_id = ?", (produto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Produto não encontrado no estoque")

    cursor.execute(
        "UPDATE estoque_produtos SET minimo = ?, atualizado_em = CURRENT_TIMESTAMP WHERE produto_id = ?",
        (minimo, produto_id),
    )
    db.commit()
    return {"status": "sucesso"}
