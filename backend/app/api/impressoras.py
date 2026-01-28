from fastapi import APIRouter, HTTPException, Request

from app.auth import require_admin
from app.printer_config import load_printer_config, save_printer_config
from app.printer_service import PrinterService, list_serial_ports

router = APIRouter(prefix="/printer", tags=["Impressão"])


@router.get("/config")
def obter_config_impressora():
    return load_printer_config()


@router.post("/config")
def atualizar_config_impressora(payload: dict, request: Request):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="payload_invalido")
    require_admin(request)
    return save_printer_config(payload)


@router.get("/ports")
def listar_portas():
    return list_serial_ports()


@router.post("/test")
def testar_porta(payload: dict | None = None):
    config = load_printer_config()
    if isinstance(payload, dict):
        for key in ("port", "baudrate", "bytesize", "parity", "stopbits", "timeout"):
            if key in payload:
                config[key] = payload[key]
    try:
        PrinterService(config).test_port()
    except RuntimeError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=400, detail="falha_ao_testar_porta") from err
    return {"status": "ok"}


@router.post("/print")
def imprimir_texto(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="payload_invalido")
    texto = payload.get("text")
    if not isinstance(texto, str) or not texto.strip():
        raise HTTPException(status_code=400, detail="texto_vazio")
    cut = payload.get("cut")
    config = load_printer_config()
    try:
        result = PrinterService(config).print_text(texto, cut=cut if isinstance(cut, bool) else None)
    except RuntimeError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=400, detail="falha_ao_imprimir") from err
    return {"status": result.status, "bytes": result.bytes}
