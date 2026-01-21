from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
import sqlite3

from app.database.dependencies import get_db
from app.models.produto import ProdutoCreate, ProdutoResponse

router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.get("/", response_model=List[ProdutoResponse])
def listar_produtos(
    busca: str | None = Query(default=None, description="Busca por código ou descrição"),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    if busca:
        like = f"%{busca}%"
        cursor.execute(
            """
            SELECT id, codigo, descricao, valor, ativo
            FROM produtos
            WHERE (codigo LIKE ? OR descricao LIKE ?)
            ORDER BY codigo
            """,
            (like, like),
        )
    else:
        cursor.execute(
            """
            SELECT id, codigo, descricao, valor, ativo
            FROM produtos
            ORDER BY codigo
            """
        )

    rows = cursor.fetchall()
    return [dict(r) for r in rows]



@router.post("/", response_model=ProdutoResponse)
def criar_produto(produto: ProdutoCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Valida código (3 dígitos)
    if not (produto.codigo.isdigit() and len(produto.codigo) == 3):
        raise HTTPException(
            status_code=400,
            detail="O código do produto deve ter exatamente 3 dígitos numéricos"
        )

    # Verifica duplicidade de código
    cursor.execute(
        "SELECT id FROM produtos WHERE codigo = ?", (produto.codigo,)
    )
    if cursor.fetchone():
        raise HTTPException(
            status_code=400,
            detail="Já existe produto com esse código"
        )

    cursor.execute(
        """
        INSERT INTO produtos (codigo, descricao, valor, ativo)
        VALUES (?, ?, ?, ?)
        """,
        (produto.codigo, produto.descricao, produto.valor, int(produto.ativo)),
    )
    db.commit()

    produto_id = cursor.lastrowid

    cursor.execute(
        "SELECT id, codigo, descricao, valor, ativo FROM produtos WHERE id = ?",
        (produto_id,),
    )
    row = cursor.fetchone()

    return dict(row)



@router.put("/{produto_id}", response_model=ProdutoResponse)
def atualizar_produto(produto_id: int, produto: ProdutoCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Verifica se existe
    cursor.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Valida código (3 dígitos)
    if not (produto.codigo.isdigit() and len(produto.codigo) == 3):
        raise HTTPException(
            status_code=400,
            detail="O código do produto deve ter exatamente 3 dígitos numéricos"
        )

    # Verifica duplicidade de código (se mudou o código)
    cursor.execute(
        "SELECT id FROM produtos WHERE codigo = ? AND id != ?",
        (produto.codigo, produto_id)
    )
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Já existe outro produto com esse código")

    cursor.execute(
        """
        UPDATE produtos
        SET codigo = ?, descricao = ?, valor = ?, ativo = ?
        WHERE id = ?
        """,
        (produto.codigo, produto.descricao, produto.valor, int(produto.ativo), produto_id),
    )
    cursor.execute(
        "SELECT id, codigo, descricao, valor, ativo FROM produtos WHERE id = ?",
        (produto_id,),
    )
    row = cursor.fetchone()
    db.commit()

    return dict(row)

@router.post("/{produto_id}/ativar", response_model=ProdutoResponse)
def ativar_produto(produto_id: int, db: sqlite3.Connection = Depends(get_db)):
    return _set_status(produto_id, True, db)


@router.post("/{produto_id}/desativar", response_model=ProdutoResponse)
def desativar_produto(produto_id: int, db: sqlite3.Connection = Depends(get_db)):
    return _set_status(produto_id, False, db)


def _set_status(produto_id: int, ativo: bool, db: sqlite3.Connection):
    cursor = db.cursor()

    cursor.execute(
        "UPDATE produtos SET ativo = ? WHERE id = ?",
        (int(ativo), produto_id),
    )
    db.commit()

    cursor.execute(
        "SELECT id, codigo, descricao, valor, ativo FROM produtos WHERE id = ?",
        (produto_id,),
    )
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return dict(row)


@router.delete("/{produto_id}")
def excluir_produto(produto_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()

    # Verifica se o produto existe
    cursor.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Verifica se há itens de comanda vinculados a este produto (pelo código)
    # Nota: Como o sistema usa o código (string) para vincular itens, 
    # precisamos verificar se o código deste produto está em uso.
    cursor.execute("SELECT codigo FROM produtos WHERE id = ?", (produto_id,))
    cod = cursor.fetchone()["codigo"]
    
    cursor.execute("SELECT id FROM itens_comanda WHERE codigo = ?", (cod,))
    if cursor.fetchone():
        raise HTTPException(
            status_code=400, 
            detail="Não é possível excluir: existem comandas vinculadas a este código de produto. Sugerimos desativar."
        )

    cursor.execute("DELETE FROM produtos WHERE id = ?", (produto_id,))
    db.commit()
    return {"status": "sucesso", "detail": "Produto excluído com sucesso"}
