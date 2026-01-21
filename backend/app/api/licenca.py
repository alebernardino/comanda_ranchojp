from fastapi import APIRouter, HTTPException

from app.license import validar_licenca, salvar_licenca

router = APIRouter(prefix="/licenca", tags=["Licença"])


@router.get("/status")
def status_licenca():
    status = validar_licenca()
    return {
        "valida": status.valid,
        "motivo": status.reason,
        "dados": status.data,
    }


@router.post("/instalar")
def instalar_licenca(payload: dict):
    ok, motivo = salvar_licenca(payload)
    if not ok:
        raise HTTPException(status_code=400, detail=motivo)
    return {"status": "sucesso"}
