from __future__ import annotations

from datetime import datetime
from typing import Any


def cupom_teste() -> str:
    return (
        "COMANDA FACIL\n"
        "RANCHO JP\n"
        "------------------------------\n"
        f"{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
        "Teste de impressao OK\n"
        "------------------------------\n"
    )


def _cols(paper_width: int | None) -> int:
    return 32 if int(paper_width or 80) <= 58 else 48


def _pad_right(text: str, width: int) -> str:
    t = str(text or "")
    if len(t) > width:
        t = t[:width]
    return t + (" " * max(0, width - len(t)))


def _pad_left(text: str, width: int) -> str:
    t = str(text or "")
    if len(t) > width:
        t = t[:width]
    return (" " * max(0, width - len(t))) + t


def _center(text: str, width: int) -> str:
    t = str(text or "")
    if len(t) > width:
        t = t[:width]
    left = (width - len(t)) // 2
    right = width - len(t) - left
    return (" " * max(0, left)) + t + (" " * max(0, right))


def _line(width: int, char: str = "-") -> str:
    return char * width


def _money(value: Any) -> str:
    try:
        v = float(value or 0)
    except Exception:
        v = 0.0
    txt = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {txt}"


def cupom_comanda(data: dict, paper_width: int | None = 80) -> str:
    cols = _cols(paper_width)
    numero = data.get("comandaNumero", "")
    nome = data.get("nomeCliente", "")
    telefone = data.get("telefone", "")
    itens = data.get("itens", []) or []
    total = data.get("total", 0)

    col_codigo = 6
    col_qtd = 4
    col_valor = 12
    col_desc = max(8, cols - col_codigo - col_qtd - col_valor - 3)

    linhas = [
        _center("RESTAURANTE RANCHO JP", cols),
        _center(f"COMANDA {numero}", cols),
        _line(cols),
    ]
    if nome:
        linhas.append(f"CLIENTE: {nome}")
    if telefone:
        linhas.append(f"TEL: {telefone}")
    linhas.append(f"DATA: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    linhas.append(_line(cols))
    linhas.append(
        _pad_right("COD", col_codigo) + " "
        + _pad_right("ITEM", col_desc) + " "
        + _pad_left("QTD", col_qtd) + " "
        + _pad_left("VALOR", col_valor)
    )
    linhas.append(_line(cols))

    for item in itens:
        linhas.append(
            _pad_right(str(item.get("codigo", "")), col_codigo) + " "
            + _pad_right(str(item.get("descricao", "")), col_desc) + " "
            + _pad_left(str(item.get("quantidade", "")), col_qtd) + " "
            + _pad_left(_money(item.get("subtotal", 0)), col_valor)
        )

    linhas.append(_line(cols))
    linhas.append(_pad_left(f"TOTAL: {_money(total)}", cols))
    linhas.append(_line(cols))
    linhas.append("")
    return "\n".join(linhas)


def cupom_parcial(data: dict, paper_width: int | None = 80) -> str:
    cols = _cols(paper_width)
    numero = data.get("comandaNumero", "")
    itens = data.get("itens", []) or []
    total = data.get("total", 0)

    col_qtd = 4
    col_valor = 12
    col_desc = max(10, cols - col_qtd - col_valor - 2)
    linhas = [
        _center("ITENS PARCIAIS", cols),
        _center(f"COMANDA {numero}", cols),
        _line(cols),
        _pad_right("ITEM", col_desc) + " " + _pad_left("QTD", col_qtd) + " " + _pad_left("VALOR", col_valor),
        _line(cols),
    ]
    for item in itens:
        linhas.append(
            _pad_right(str(item.get("descricao", "")), col_desc) + " "
            + _pad_left(str(item.get("quantidade", "")), col_qtd) + " "
            + _pad_left(_money(item.get("subtotal", 0)), col_valor)
        )
    linhas.append(_line(cols))
    linhas.append(_pad_left(f"TOTAL: {_money(total)}", cols))
    linhas.append(_line(cols))
    linhas.append("")
    return "\n".join(linhas)


def cupom_pagamento(data: dict, paper_width: int | None = 80) -> str:
    cols = _cols(paper_width)
    numero = data.get("comandaNumero", "")
    pagamentos = data.get("pagamentos", []) or []
    total = data.get("total", 0)
    col_forma = max(12, cols - 13)
    linhas = [
        _center("RESUMO DE PAGAMENTO", cols),
        f"COMANDA: {numero}",
        f"DATA: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        _line(cols),
    ]
    for p in pagamentos:
        linhas.append(_pad_right(str(p.get("forma", "")), col_forma) + " " + _pad_left(_money(p.get("valor", 0)), 12))
    linhas.append(_line(cols))
    linhas.append(_pad_left(f"TOTAL: {_money(total)}", cols))
    linhas.append(_line(cols))
    linhas.append("")
    return "\n".join(linhas)


def cupom_fechamento(data: dict, paper_width: int | None = 80) -> str:
    cols = _cols(paper_width)
    data_ref = str(data.get("data", ""))
    vendas = data.get("vendas", []) or []
    pagamentos = data.get("pagamentos", []) or []
    recebimentos_sistema = data.get("recebimentosSistema", []) or []
    recebimentos_manuais = data.get("recebimentosManuais", []) or []

    linhas = [_center("FECHAMENTO DIARIO", cols), f"DATA: {data_ref}", _line(cols)]

    if vendas:
        linhas.append("VENDAS POR ITEM")
        for v in vendas:
            linhas.append(_pad_right(str(v.get("descricao", "")), cols - 6) + _pad_left(str(v.get("quantidade", "")), 6))
        linhas.append(_line(cols))

    if pagamentos:
        linhas.append("PAGAMENTOS (SAIDAS)")
        for p in pagamentos:
            linhas.append(_pad_right(str(p.get("fornecedor", "")), cols - 12) + _pad_left(_money(p.get("total", 0)), 12))
        linhas.append(_line(cols))

    if recebimentos_sistema:
        linhas.append("RECEBIMENTOS (SISTEMA)")
        for r in recebimentos_sistema:
            linhas.append(_pad_right(str(r.get("forma", "")), cols - 12) + _pad_left(_money(r.get("total", 0)), 12))
        linhas.append(_line(cols))

    manuais_filtrados = []
    for m in recebimentos_manuais:
        try:
            if float(m.get("valor", 0) or 0) > 0:
                manuais_filtrados.append(m)
        except Exception:
            pass

    if manuais_filtrados:
        linhas.append("RECEBIMENTOS (MANUAL)")
        for m in manuais_filtrados:
            linhas.append(_pad_right(str(m.get("forma", "")), cols - 12) + _pad_left(_money(m.get("valor", 0)), 12))
        linhas.append(_line(cols))

    linhas.append("Conferido por: __________________")
    linhas.append("")
    return "\n".join(linhas)


def render_document(kind: str, data: dict, paper_width: int | None = 80) -> str:
    kind_normalized = (kind or "").strip().lower()
    if kind_normalized == "comanda":
        return cupom_comanda(data, paper_width)
    if kind_normalized in ("parcial", "cozinha", "itens_parciais"):
        return cupom_parcial(data, paper_width)
    if kind_normalized in ("pagamento", "resumo_pagamento"):
        return cupom_pagamento(data, paper_width)
    if kind_normalized == "fechamento":
        return cupom_fechamento(data, paper_width)
    if kind_normalized == "teste":
        return cupom_teste()
    raise ValueError("tipo_documento_invalido")
