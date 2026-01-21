from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

CONFIG_PATH = Path(__file__).resolve().parent / "database" / "config.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "modulos": {
        "divisao_item": True,
        "estoque": True,
        "clientes": True,
        "colaboradores": True,
        "usuarios": True,
        "relatorios": True,
    }
}


def _plano_aplicado(modulos: Dict[str, Any], plano: str | None) -> Dict[str, Any]:
    if plano == "essencial":
        return {
            "divisao_item": False,
            "estoque": False,
            "clientes": False,
            "colaboradores": False,
            "usuarios": True,
            "relatorios": False,
        }
    return modulos


def load_config() -> Dict[str, Any]:
    if not CONFIG_PATH.exists():
        return DEFAULT_CONFIG.copy()
    try:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return DEFAULT_CONFIG.copy()

    modulos = data.get("modulos", {})
    normalized = {
        "divisao_item": bool(modulos.get("divisao_item", True)),
        "estoque": bool(modulos.get("estoque", True)),
        "clientes": bool(modulos.get("clientes", True)),
        "colaboradores": bool(modulos.get("colaboradores", True)),
        "usuarios": bool(modulos.get("usuarios", True)),
        "relatorios": bool(modulos.get("relatorios", True)),
    }
    plano = data.get("plano")
    try:
        from app.license import validar_licenca
        status = validar_licenca()
        if status.valid and status.data:
            plano = status.data.get("plano", plano)
    except Exception:
        pass

    plano = plano or "total"
    return {
        "plano": plano,
        "modulos": _plano_aplicado(normalized, plano),
    }


def save_config(data: Dict[str, Any]) -> Dict[str, Any]:
    modulos = data.get("modulos", {}) if isinstance(data, dict) else {}
    normalized = {
        "modulos": {
            "divisao_item": bool(modulos.get("divisao_item", True)),
            "estoque": bool(modulos.get("estoque", True)),
            "clientes": bool(modulos.get("clientes", True)),
            "colaboradores": bool(modulos.get("colaboradores", True)),
            "usuarios": bool(modulos.get("usuarios", True)),
            "relatorios": bool(modulos.get("relatorios", True)),
        }
    }
    CONFIG_PATH.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")
    return load_config()
