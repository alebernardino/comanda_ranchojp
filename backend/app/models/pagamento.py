from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PagamentoBase(BaseModel):
    forma: str
    valor: float
    detalhe: Optional[str] = None


class PagamentoCreate(PagamentoBase):
    comanda_id: int


class PagamentoResponse(PagamentoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
