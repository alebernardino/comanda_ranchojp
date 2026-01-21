from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EstoqueProdutoResponse(BaseModel):
    produto_id: int
    codigo: str
    descricao: str
    quantidade: float
    minimo: float
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True


class EstoqueMovimentoCreate(BaseModel):
    produto_id: int
    tipo: str
    quantidade: float
    motivo: Optional[str] = None
    origem: Optional[str] = None
    referencia: Optional[str] = None


class EstoqueMovimentoResponse(EstoqueMovimentoCreate):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
