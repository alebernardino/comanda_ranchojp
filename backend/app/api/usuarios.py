from fastapi import APIRouter, Depends, HTTPException, Request
import sqlite3
import bcrypt

from app.database.dependencies import get_db
from app.auth import require_admin

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/")
def listar_usuarios(request: Request, db: sqlite3.Connection = Depends(get_db)):
    require_admin(request)
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, username, perfil, ativo, criado_em FROM usuarios ORDER BY username"
    )
    rows = cursor.fetchall()
    return [dict(r) for r in rows]


@router.post("/")
def criar_usuario(payload: dict, request: Request, db: sqlite3.Connection = Depends(get_db)):
    require_admin(request)
    username = (payload.get("username") or "").strip()
    senha = payload.get("senha") or ""
    perfil = (payload.get("perfil") or "operador").strip().lower()
    if perfil not in ("admin", "operador"):
        raise HTTPException(status_code=400, detail="perfil_invalido")
    if not username or not senha:
        raise HTTPException(status_code=400, detail="dados_invalidos")

    cursor = db.cursor()
    cursor.execute("SELECT id FROM usuarios WHERE username = ?", (username,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="usuario_ja_existe")

    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor.execute(
        "INSERT INTO usuarios (username, senha_hash, perfil, ativo) VALUES (?, ?, ?, 1)",
        (username, senha_hash, perfil),
    )
    db.commit()
    return {"status": "ok"}


@router.put("/{usuario_id}/status")
def atualizar_status(usuario_id: int, payload: dict, request: Request, db: sqlite3.Connection = Depends(get_db)):
    require_admin(request)
    ativo = payload.get("ativo")
    if ativo is None:
        raise HTTPException(status_code=400, detail="ativo_invalido")
    cursor = db.cursor()
    cursor.execute("UPDATE usuarios SET ativo = ? WHERE id = ?", (int(bool(ativo)), usuario_id))
    db.commit()
    return {"status": "ok"}
