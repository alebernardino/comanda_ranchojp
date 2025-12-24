from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PagamentoCreate(BaseModel):
    forma: str
    valor: float
    detalhe: Optional[str] = None


class PagamentoResponse(PagamentoCreate):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
