from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
import sqlite3
import json
from app.database.dependencies import get_db
from app.models.colaborador import Colaborador, ColaboradorCreate, ColaboradorUpdate

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

@router.get("/", response_model=List[Colaborador])
def listar_colaboradores(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM colaboradores ORDER BY nome")
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        d = dict(row)
        d['contatos'] = json.loads(d['contatos']) if d['contatos'] else []
        d['pixs'] = json.loads(d['pixs']) if d['pixs'] else []
        result.append(d)
    return result

@router.post("/", response_model=Colaborador)
def criar_colaborador(c: ColaboradorCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO colaboradores (nome, endereco, contatos, pixs, funcao, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (c.nome, c.endereco, json.dumps(c.contatos), json.dumps(c.pixs), c.funcao, int(c.ativo))
    )
    db.commit()
    colab_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM colaboradores WHERE id = ?", (colab_id,))
    row = cursor.fetchone()
    d = dict(row)
    d['contatos'] = json.loads(d['contatos']) if d['contatos'] else []
    d['pixs'] = json.loads(d['pixs']) if d['pixs'] else []
    return d

@router.put("/{id}", response_model=Colaborador)
def atualizar_colaborador(id: int, c: ColaboradorUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    # Get current
    cursor.execute("SELECT * FROM colaboradores WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    update_data = c.model_dump(exclude_unset=True)
    
    fields = []
    values = []
    for key, val in update_data.items():
        fields.append(f"{key} = ?")
        if key in ['contatos', 'pixs']:
            values.append(json.dumps(val))
        elif key == 'ativo':
            values.append(int(val))
        else:
            values.append(val)
            
    if not fields:
        # No fields to update
        d = dict(row)
        d['contatos'] = json.loads(d['contatos']) if d['contatos'] else []
        d['pixs'] = json.loads(d['pixs']) if d['pixs'] else []
        return d

    values.append(id)
    cursor.execute(f"UPDATE colaboradores SET {', '.join(fields)} WHERE id = ?", tuple(values))
    db.commit()
    
    cursor.execute("SELECT * FROM colaboradores WHERE id = ?", (id,))
    row = cursor.fetchone()
    d = dict(row)
    d['contatos'] = json.loads(d['contatos']) if d['contatos'] else []
    d['pixs'] = json.loads(d['pixs']) if d['pixs'] else []
    return d

@router.delete("/{id}")
def excluir_colaborador(id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM colaboradores WHERE id = ?", (id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
    cursor.execute("DELETE FROM colaboradores WHERE id = ?", (id,))
    db.commit()
    return {"status": "sucesso", "detail": "Colaborador excluído com sucesso"}
