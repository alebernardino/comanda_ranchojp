from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from datetime import datetime, time
from pathlib import Path
from typing import Optional, Tuple

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

LICENSE_PATH = Path(__file__).resolve().parent / "database" / "licenca.json"
PUBLIC_KEY_PATH = Path(__file__).resolve().parent / "license_public_key.txt"


@dataclass
class LicenseStatus:
    valid: bool
    reason: str
    data: Optional[dict] = None


def _get_public_key() -> Optional[Ed25519PublicKey]:
    b64 = os.getenv("LICENSE_PUBLIC_KEY_B64")
    if not b64 and PUBLIC_KEY_PATH.exists():
        b64 = PUBLIC_KEY_PATH.read_text(encoding="utf-8").strip()
    if not b64:
        return None
    try:
        raw = base64.b64decode(b64)
        return Ed25519PublicKey.from_public_bytes(raw)
    except Exception:
        return None


def _load_license() -> Optional[dict]:
    if not LICENSE_PATH.exists():
        return None
    try:
        return json.loads(LICENSE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


def _license_message(data: dict) -> Optional[bytes]:
    try:
        cliente = data["cliente"]
        emitida_em = data["emitida_em"]
        expira_em = data["expira_em"]
    except KeyError:
        return None
    plano = data.get("plano")
    if plano:
        return f"{cliente}|{emitida_em}|{expira_em}|{plano}".encode("utf-8")
    return f"{cliente}|{emitida_em}|{expira_em}".encode("utf-8")


def _parse_expiration(value: str) -> Optional[datetime]:
    try:
        # Aceita "YYYY-MM-DD" ou ISO completo
        if len(value) == 10:
            dt = datetime.fromisoformat(value)
            return datetime.combine(dt.date(), time(23, 59, 59))
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def validar_licenca() -> LicenseStatus:
    if os.getenv("LICENSE_BYPASS") == "1":
        return LicenseStatus(valid=True, reason="bypass")

    pubkey = _get_public_key()
    if not pubkey:
        return LicenseStatus(valid=False, reason="chave_publica_invalida")

    data = _load_license()
    if not data:
        return LicenseStatus(valid=False, reason="licenca_ausente")

    assinatura_b64 = data.get("assinatura")
    if not assinatura_b64:
        return LicenseStatus(valid=False, reason="assinatura_ausente")

    msg = _license_message(data)
    if not msg:
        return LicenseStatus(valid=False, reason="licenca_invalida")

    try:
        assinatura = base64.b64decode(assinatura_b64)
        pubkey.verify(assinatura, msg)
    except Exception:
        return LicenseStatus(valid=False, reason="assinatura_invalida")

    expira = _parse_expiration(data.get("expira_em", ""))
    if not expira:
        return LicenseStatus(valid=False, reason="expiracao_invalida")

    if datetime.now() > expira:
        return LicenseStatus(valid=False, reason="licenca_expirada", data=data)

    return LicenseStatus(valid=True, reason="ok", data=data)


def salvar_licenca(payload: dict) -> Tuple[bool, str]:
    msg = _license_message(payload)
    if not msg or "assinatura" not in payload:
        return False, "licenca_invalida"
    try:
        LICENSE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        return False, "erro_ao_salvar"
    return True, "salva"
