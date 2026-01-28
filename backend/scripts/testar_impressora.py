from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from app.printer_config import load_printer_config  # noqa: E402
from app.printer_service import PrinterService  # noqa: E402


def build_test_text() -> str:
    linhas = [
        "TESTE DE IMPRESSAO",
        "Comanda Rancho JP",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "--------------------------------",
        "Item 1       1   R$ 10,00",
        "Item 2       2   R$ 20,00",
        "TOTAL: R$ 30,00",
        "--------------------------------",
        "Obrigado!",
        "",
    ]
    return "\n".join(linhas)


def main() -> int:
    parser = argparse.ArgumentParser(description="Teste local de impressora ESC/POS (serial/simulado).")
    parser.add_argument("--port", help="Porta COM (ex: COM3)")
    parser.add_argument("--baudrate", type=int, help="Baudrate (ex: 9600)")
    parser.add_argument("--mode", choices=["serial", "simulado"], help="Forca modo (serial/simulado)")
    parser.add_argument("--no-cut", action="store_true", help="Nao cortar papel")
    args = parser.parse_args()

    config = load_printer_config()
    if args.port:
        config["port"] = args.port
    if args.baudrate:
        config["baudrate"] = args.baudrate
    if args.mode:
        config["mode"] = args.mode

    if config.get("mode") not in ("serial", "simulado"):
        print("Modo atual nao eh serial/simulado. Ajuste em Configuracao > Impressora.")
        return 2

    service = PrinterService(config)
    try:
        service.test_port()
    except Exception as exc:
        print(f"Falha ao testar porta: {exc}")
        return 1

    texto = build_test_text()
    try:
        result = service.print_text(texto, cut=not args.no_cut)
    except Exception as exc:
        print(f"Falha ao imprimir: {exc}")
        return 1

    print(f"OK: status={result.status} bytes={result.bytes}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
