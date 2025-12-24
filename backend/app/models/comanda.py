from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ComandaCreate(BaseModel):
    numero: int
    nome: Optional[str] = None


class ComandaResponse(ComandaCreate):
    id: int
    status: str
    criada_em: datetime
    finalizada_em: Optional[datetime]

    class Config:
        from_attributes = True
