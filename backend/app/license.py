from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

LICENSE_PATH = Path(__file__).resolve().parent / "database" / "licenca.json"


@dataclass
class LicenseStatus:
    valid: bool
    reason: str
    data: Optional[dict] = None


def validar_licenca() -> LicenseStatus:
    # Licenciamento desativado: sistema sempre opera em plano total.
    return LicenseStatus(valid=True, reason="disabled", data={"plano": "total"})


def salvar_licenca(payload: dict) -> Tuple[bool, str]:
    if not isinstance(payload, dict):
        return False, "licenca_invalida"
    try:
        LICENSE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        return False, "erro_ao_salvar"
    return True, "salva"
