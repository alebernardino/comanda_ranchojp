from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from app.printer_config import load_printer_config

try:
    import serial
    from serial.tools import list_ports
    SERIAL_AVAILABLE = True
except Exception:
    SERIAL_AVAILABLE = False


LOG_PATH = Path(__file__).resolve().parent / "database" / "printer_simulado.log"


def list_serial_ports() -> Dict[str, Any]:
    if not SERIAL_AVAILABLE:
        return {"available": False, "ports": []}
    return {"available": True, "ports": [p.device for p in list_ports.comports()]}


@dataclass
class PrintResult:
    status: str
    bytes: int = 0
    detail: str | None = None


class PrinterService:
    def __init__(self, config: Dict[str, Any] | None = None) -> None:
        self.config = config or load_printer_config()
        self._serial = None

    def open_port(self) -> None:
        if not SERIAL_AVAILABLE:
            raise RuntimeError("pyserial_nao_instalado")
        port = self.config.get("port")
        if not port:
            raise RuntimeError("porta_nao_configurada")

        parity_map = {
            "N": serial.PARITY_NONE,
            "E": serial.PARITY_EVEN,
            "O": serial.PARITY_ODD,
            "M": serial.PARITY_MARK,
            "S": serial.PARITY_SPACE,
        }
        bytesize_map = {
            5: serial.FIVEBITS,
            6: serial.SIXBITS,
            7: serial.SEVENBITS,
            8: serial.EIGHTBITS,
        }
        stopbits_map = {
            1: serial.STOPBITS_ONE,
            2: serial.STOPBITS_TWO,
        }

        self._serial = serial.Serial(
            port=port,
            baudrate=self.config.get("baudrate", 9600),
            bytesize=bytesize_map.get(self.config.get("bytesize", 8), serial.EIGHTBITS),
            parity=parity_map.get(self.config.get("parity", "N"), serial.PARITY_NONE),
            stopbits=stopbits_map.get(self.config.get("stopbits", 1), serial.STOPBITS_ONE),
            timeout=self.config.get("timeout", 1),
        )

    def close_port(self) -> None:
        if self._serial and self._serial.is_open:
            self._serial.close()
        self._serial = None

    def test_port(self) -> None:
        self.open_port()
        self.close_port()

    def _write_simulated(self, text: str) -> PrintResult:
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        payload = f"\n--- {stamp} ---\n{text}\n"
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as handle:
            handle.write(payload)
        return PrintResult(status="simulado", bytes=len(text.encode("utf-8")))

    def print_text(self, text: str, cut: bool | None = None) -> PrintResult:
        mode = self.config.get("mode", "qz")
        if mode == "simulado":
            return self._write_simulated(text)
        if mode != "serial":
            raise RuntimeError("modo_impressao_invalido")

        self.open_port()
        try:
            # Inicializa modo ESC/POS
            self._serial.write(b"\x1b\x40")

            if not text.endswith("\n"):
                text += "\n"
            text += "\n\n"

            encoding = self.config.get("encoding", "cp860")
            payload = text.encode(encoding, errors="replace")
            bytes_written = self._serial.write(payload)
            if cut if cut is not None else self.config.get("autoCut", True):
                self.cut_paper()
            return PrintResult(status="ok", bytes=bytes_written)
        finally:
            self.close_port()

    def cut_paper(self) -> None:
        if not self._serial:
            return
        self._serial.write(b"\x1d\x56\x41\x00")
