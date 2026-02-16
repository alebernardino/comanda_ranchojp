from __future__ import annotations

from app.printing.layouts import render_document
from app.printer_config import load_printer_config
from app.printer_service import PrinterService, PrintResult


class PrintManager:
    def __init__(self) -> None:
        self.config = load_printer_config()

    def print_text(self, text: str, cut: bool | None = None) -> PrintResult:
        return PrinterService(self.config).print_text(text, cut=cut)

    def print_document(self, kind: str, data: dict, cut: bool | None = None) -> PrintResult:
        text = render_document(kind, data, self.config.get("paperWidth", 80))
        return PrinterService(self.config).print_text(text, cut=cut)
