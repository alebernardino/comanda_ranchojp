from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PagamentoCreate(BaseModel):
    forma: str
    valor: float
    detalhe: Optional[str] = None
    itens: Optional[List[dict]] = None  # [{ "id": int, "quantidade": float }]


class PagamentoResponse(PagamentoCreate):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
