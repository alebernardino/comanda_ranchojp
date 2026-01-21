from fastapi import APIRouter, HTTPException, Request

from app.config import load_config, save_config
from app.auth import require_admin

router = APIRouter(prefix="/config", tags=["Configuração"])


@router.get("/")
def obter_config():
    return load_config()


@router.post("/")
def atualizar_config(payload: dict, request: Request):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="payload_invalido")
    require_admin(request)
    return save_config(payload)
