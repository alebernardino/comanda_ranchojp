from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PagamentoGeralBase(BaseModel):
    data: Optional[datetime] = None
    nome: str
    item_servico: str
    valor: float
    forma_pagamento: Optional[str] = None
    pago: Optional[bool] = True

class PagamentoGeralCreate(PagamentoGeralBase):
    pass

class PagamentoGeral(PagamentoGeralBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
