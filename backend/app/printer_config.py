from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

CONFIG_PATH = Path(__file__).resolve().parent / "database" / "printer.json"

DEFAULT_PRINTER_CONFIG: Dict[str, Any] = {
    "mode": "qz",  # qz | browser | serial | simulado
    "port": "",
    "baudrate": 9600,
    "bytesize": 8,
    "parity": "N",
    "stopbits": 1,
    "timeout": 1,
    "encoding": "cp860",
    "paperWidth": 80,
    "autoCut": True,
}

VALID_MODES = {"qz", "browser", "serial", "simulado"}


def _normalize_config(data: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(data, dict):
        return DEFAULT_PRINTER_CONFIG.copy()

    mode = str(data.get("mode") or DEFAULT_PRINTER_CONFIG["mode"]).lower()
    if mode not in VALID_MODES:
        mode = DEFAULT_PRINTER_CONFIG["mode"]

    port = str(data.get("port") or "").strip()
    try:
        baudrate = int(data.get("baudrate", DEFAULT_PRINTER_CONFIG["baudrate"]))
    except Exception:
        baudrate = DEFAULT_PRINTER_CONFIG["baudrate"]

    try:
        bytesize = int(data.get("bytesize", DEFAULT_PRINTER_CONFIG["bytesize"]))
    except Exception:
        bytesize = DEFAULT_PRINTER_CONFIG["bytesize"]

    parity = str(data.get("parity", DEFAULT_PRINTER_CONFIG["parity"]))[:1].upper()
    if parity not in ("N", "E", "O", "M", "S"):
        parity = DEFAULT_PRINTER_CONFIG["parity"]

    try:
        stopbits = int(data.get("stopbits", DEFAULT_PRINTER_CONFIG["stopbits"]))
    except Exception:
        stopbits = DEFAULT_PRINTER_CONFIG["stopbits"]

    try:
        timeout = float(data.get("timeout", DEFAULT_PRINTER_CONFIG["timeout"]))
    except Exception:
        timeout = DEFAULT_PRINTER_CONFIG["timeout"]

    encoding = str(data.get("encoding") or DEFAULT_PRINTER_CONFIG["encoding"]).strip() or DEFAULT_PRINTER_CONFIG["encoding"]

    try:
        paper_width = int(data.get("paperWidth", DEFAULT_PRINTER_CONFIG["paperWidth"]))
    except Exception:
        paper_width = DEFAULT_PRINTER_CONFIG["paperWidth"]
    if paper_width not in (58, 80):
        paper_width = DEFAULT_PRINTER_CONFIG["paperWidth"]

    auto_cut = bool(data.get("autoCut", DEFAULT_PRINTER_CONFIG["autoCut"]))

    return {
        "mode": mode,
        "port": port,
        "baudrate": baudrate,
        "bytesize": bytesize,
        "parity": parity,
        "stopbits": stopbits,
        "timeout": timeout,
        "encoding": encoding,
        "paperWidth": paper_width,
        "autoCut": auto_cut,
    }


def load_printer_config() -> Dict[str, Any]:
    if not CONFIG_PATH.exists():
        return DEFAULT_PRINTER_CONFIG.copy()
    try:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return DEFAULT_PRINTER_CONFIG.copy()
    return _normalize_config(data)


def save_printer_config(payload: Dict[str, Any]) -> Dict[str, Any]:
    normalized = _normalize_config(payload)
    CONFIG_PATH.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")
    return normalized
