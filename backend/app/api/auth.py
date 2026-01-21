from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
import sqlite3

from app.database.dependencies import get_db
from app.auth import autenticar_usuario, criar_sessao, encerrar_sessao

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(payload: dict, db: sqlite3.Connection = Depends(get_db)):
    username = (payload.get("username") or "").strip()
    senha = payload.get("senha") or ""
    if not username or not senha:
        raise HTTPException(status_code=400, detail="credenciais_invalidas")

    usuario = autenticar_usuario(db, username, senha)
    if not usuario:
        raise HTTPException(status_code=401, detail="usuario_ou_senha_invalidos")

    token, expira_em = criar_sessao(db, usuario["id"])
    resp = JSONResponse(
        content={
            "status": "ok",
            "usuario": {
                "id": usuario["id"],
                "username": usuario["username"],
                "perfil": usuario["perfil"],
            },
            "expira_em": expira_em.isoformat(),
        }
    )
    resp.set_cookie(
        key="session_id",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 12,
    )
    return resp


@router.post("/logout")
def logout(request: Request, db: sqlite3.Connection = Depends(get_db)):
    token = request.cookies.get("session_id")
    if token:
        encerrar_sessao(db, token)
    resp = JSONResponse(content={"status": "ok"})
    resp.delete_cookie("session_id")
    return resp


@router.get("/me")
def me(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="nao_autenticado")
    return {"usuario": {"id": user["id"], "username": user["username"], "perfil": user["perfil"]}}
