from pydantic import BaseModel
from datetime import datetime


class ItemComandaCreate(BaseModel):
    codigo: str
    descricao: str
    quantidade: float
    valor: float


class ItemComandaResponse(ItemComandaCreate):
    id: int
    subtotal: float
    quantidade_paga: float
    criado_em: datetime

    class Config:
        from_attributes = True
