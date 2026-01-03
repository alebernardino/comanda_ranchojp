from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import sqlite3
from app.database.dependencies import get_db
from app.models.pagamento_geral import PagamentoGeral, PagamentoGeralCreate
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])

class PagamentoUpdate(BaseModel):
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
    
    if u.pago is not None:
        cursor.execute("UPDATE pagamentos_gerais SET pago = ? WHERE id = ?", (int(u.pago), id))
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
