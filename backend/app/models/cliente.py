from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClienteResponse(BaseModel):
    id: int
    nome: str
    telefone: str
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True
