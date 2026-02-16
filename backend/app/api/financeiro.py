from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import sqlite3
from app.database.dependencies import get_db
from app.models.pagamento_geral import PagamentoGeral, PagamentoGeralCreate
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])

class PagamentoUpdate(BaseModel):
    data: Optional[datetime] = None
    nome: Optional[str] = None
    item_servico: Optional[str] = None
    valor: Optional[float] = None
    forma_pagamento: Optional[str] = None
    pago: Optional[bool] = None

@router.get("/", response_model=List[PagamentoGeral])
def listar_pagamentos(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM pagamentos_gerais ORDER BY data DESC, id DESC")
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

@router.post("/", response_model=PagamentoGeral)
def criar_pagamento(p: PagamentoGeralCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    dt = p.data if p.data else datetime.now()
    
    cursor.execute(
        """
        INSERT INTO pagamentos_gerais (data, nome, item_servico, valor, forma_pagamento, pago)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (dt.isoformat(), p.nome, p.item_servico, p.valor, p.forma_pagamento, int(p.pago))
    )
    db.commit()
    pag_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM pagamentos_gerais WHERE id = ?", (pag_id,))
    row = cursor.fetchone()
    return dict(row)

@router.put("/{id}")
def atualizar_pagamento(id: int, u: PagamentoUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM pagamentos_gerais WHERE id = ?", (id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Não encontrado")
    
    campos = []
    valores = []

    if u.data is not None:
        campos.append("data = ?")
        valores.append(u.data.isoformat())
    if u.nome is not None:
        campos.append("nome = ?")
        valores.append(u.nome)
    if u.item_servico is not None:
        campos.append("item_servico = ?")
        valores.append(u.item_servico)
    if u.valor is not None:
        campos.append("valor = ?")
        valores.append(u.valor)
    if u.forma_pagamento is not None:
        campos.append("forma_pagamento = ?")
        valores.append(u.forma_pagamento)
    if u.pago is not None:
        campos.append("pago = ?")
        valores.append(int(u.pago))

    if not campos:
        return {"status": "sucesso"}

    valores.append(id)
    cursor.execute(
        f"UPDATE pagamentos_gerais SET {', '.join(campos)} WHERE id = ?",
        tuple(valores)
    )
    db.commit()

    return {"status": "sucesso"}

@router.delete("/{id}")
def excluir_pagamento(id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM pagamentos_gerais WHERE id = ?", (id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    cursor.execute("DELETE FROM pagamentos_gerais WHERE id = ?", (id,))
    db.commit()
    return {"status": "sucesso", "detail": "Pagamento excluído com sucesso"}
