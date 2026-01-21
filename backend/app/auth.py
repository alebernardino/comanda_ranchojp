from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

import sqlite3
import bcrypt
from fastapi import Request, HTTPException

SESSION_HOURS = 12


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def criar_sessao(db: sqlite3.Connection, usuario_id: int) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    token_hash = _hash_token(token)
    expira_em = datetime.now() + timedelta(hours=SESSION_HOURS)
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO sessoes (usuario_id, token_hash, expira_em)
        VALUES (?, ?, ?)
        """,
        (usuario_id, token_hash, expira_em.isoformat(sep=" ")),
    )
    db.commit()
    return token, expira_em


def encerrar_sessao(db: sqlite3.Connection, token: str) -> None:
    token_hash = _hash_token(token)
    cursor = db.cursor()
    cursor.execute("DELETE FROM sessoes WHERE token_hash = ?", (token_hash,))
    db.commit()


def buscar_usuario_por_sessao(db: sqlite3.Connection, token: str) -> Optional[dict]:
    token_hash = _hash_token(token)
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT u.id, u.username, u.perfil, u.ativo, s.expira_em
        FROM sessoes s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token_hash = ?
        """,
        (token_hash,),
    )
    row = cursor.fetchone()
    if not row:
        return None
    expira_em = datetime.fromisoformat(row["expira_em"])
    if datetime.now() > expira_em:
        cursor.execute("DELETE FROM sessoes WHERE token_hash = ?", (token_hash,))
        db.commit()
        return None
    if not row["ativo"]:
        return None
    return dict(row)


def autenticar_usuario(db: sqlite3.Connection, username: str, senha: str) -> Optional[dict]:
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, username, senha_hash, perfil, ativo FROM usuarios WHERE username = ?",
        (username,),
    )
    row = cursor.fetchone()
    if not row:
        return None
    if not row["ativo"]:
        return None
    if not bcrypt.checkpw(senha.encode("utf-8"), row["senha_hash"].encode("utf-8")):
        return None
    return dict(row)


def require_user(request: Request) -> dict:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="nao_autenticado")
    return user


def require_admin(request: Request) -> dict:
    user = require_user(request)
    if user.get("perfil") != "admin":
        raise HTTPException(status_code=403, detail="acesso_negado")
    return user
