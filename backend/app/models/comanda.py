from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComandaBase(BaseModel):
    numero: int
    nome: Optional[str] = None


class ComandaCreate(ComandaBase):
    pass


class ComandaResponse(ComandaBase):
    id: int
    status: str
    criada_em: datetime
    finalizada_em: Optional[datetime] = None

    class Config:
        from_attributes = True
