from fastapi import APIRouter, HTTPException, Query
from typing import List

from app.database.connection import get_connection
from app.models.produto import ProdutoCreate, ProdutoResponse

router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.get("/", response_model=List[ProdutoResponse])
def listar_produtos(
    busca: str | None = Query(default=None, description="Busca por código ou descrição")
):
    conn = get_connection()
    cursor = conn.cursor()

    if busca:
        like = f"%{busca}%"
        cursor.execute(
            """
            SELECT id, codigo, descricao, valor, ativo
            FROM produtos
            WHERE ativo = 1
              AND (codigo LIKE ? OR descricao LIKE ?)
            ORDER BY descricao
            """,
            (like, like),
        )
    else:
        cursor.execute(
            """
            SELECT id, codigo, descricao, valor, ativo
            FROM produtos
            WHERE ativo = 1
            ORDER BY descricao
            """
        )

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]



@router.post("/", response_model=ProdutoResponse)
def criar_produto(produto: ProdutoCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Verifica duplicidade de código
    cursor.execute(
        "SELECT id FROM produtos WHERE codigo = ?", (produto.codigo,)
    )
    if cursor.fetchone():
        conn.close()
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
    conn.commit()

    produto_id = cursor.lastrowid

    cursor.execute(
        "SELECT id, codigo, descricao, valor, ativo FROM produtos WHERE id = ?",
        (produto_id,),
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row)



@router.put("/{produto_id}", response_model=ProdutoResponse)
def atualizar_produto(produto_id: int, produto: ProdutoCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Verifica se existe
    cursor.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Verifica duplicidade de código (se mudou o código)
    cursor.execute(
        "SELECT id FROM produtos WHERE codigo = ? AND id != ?",
        (produto.codigo, produto_id)
    )
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Já existe outro produto com esse código")

    cursor.execute(
        """
        UPDATE produtos
        SET codigo = ?, descricao = ?, valor = ?, ativo = ?
        WHERE id = ?
        """,
        (produto.codigo, produto.descricao, produto.valor, int(produto.ativo), produto_id),
    )
    conn.commit()

    cursor.execute(
        "SELECT id, codigo, descricao, valor, ativo FROM produtos WHERE id = ?",
        (produto_id,),
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row)

@router.post("/{produto_id}/ativar", response_model=ProdutoResponse)
def ativar_produto(produto_id: int):
    return _set_status(produto_id, True)


@router.post("/{produto_id}/desativar", response_model=ProdutoResponse)
def desativar_produto(produto_id: int):
    return _set_status(produto_id, False)


def _set_status(produto_id: int, ativo: bool):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE produtos SET ativo = ? WHERE id = ?",
        (int(ativo), produto_id),
    )
    conn.commit()

    cursor.execute(
        "SELECT id, codigo, descricao, valor, ativo FROM produtos WHERE id = ?",
        (produto_id,),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return dict(row)

