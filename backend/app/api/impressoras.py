from fastapi import APIRouter, HTTPException, Request

from app.auth import require_admin
from app.printing.layouts import cupom_teste
from app.printing.manager import PrintManager
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


@router.get("/status")
def status_impressora():
    config = load_printer_config()
    ports_info = list_serial_ports()
    mode = str(config.get("mode") or "").lower()
    port = str(config.get("port") or "").strip()

    status = {
        "mode": mode,
        "port": port,
        "serial_available": bool(ports_info.get("available")),
        "ports": ports_info.get("ports", []),
        "configured_port_found": bool(port and port in (ports_info.get("ports", []) or [])),
        "ready": False,
        "detail": "nao_verificado",
    }

    if mode == "simulado":
        status["ready"] = True
        status["detail"] = "simulado"
        return status

    if mode != "serial":
        status["detail"] = "modo_nao_serial"
        return status

    try:
        PrinterService(config).test_port()
        status["ready"] = True
        status["detail"] = "ok"
    except RuntimeError as err:
        status["detail"] = str(err)
    except Exception:
        status["detail"] = "falha_ao_testar_porta"
    return status


@router.post("/test")
def testar_porta(payload: dict | None = None):
    config = load_printer_config()
    if isinstance(payload, dict):
        for key in ("port", "baudrate", "bytesize", "parity", "stopbits", "timeout"):
            if key in payload:
                config[key] = payload[key]
    if str(config.get("mode") or "").lower() == "serial":
        ports_info = list_serial_ports()
        port = str(config.get("port") or "").strip()
        if not port:
            raise HTTPException(status_code=400, detail="porta_nao_configurada")
        if ports_info.get("available") and port not in (ports_info.get("ports", []) or []):
            raise HTTPException(status_code=400, detail="porta_nao_encontrada")
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


@router.post("/print-document")
def imprimir_documento(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="payload_invalido")
    kind = payload.get("kind")
    data = payload.get("data")
    cut = payload.get("cut")
    if not isinstance(kind, str) or not kind.strip():
        raise HTTPException(status_code=400, detail="tipo_documento_invalido")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="dados_documento_invalidos")

    try:
        result = PrintManager().print_document(kind, data, cut=cut if isinstance(cut, bool) else None)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except RuntimeError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=400, detail="falha_ao_imprimir") from err
    return {"status": result.status, "bytes": result.bytes}


@router.post("/test-cupom")
def testar_cupom():
    try:
        result = PrintManager().print_text(cupom_teste(), cut=True)
    except RuntimeError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=400, detail="falha_ao_imprimir") from err
    return {"status": result.status, "bytes": result.bytes}
