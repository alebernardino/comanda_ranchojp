from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComandaBase(BaseModel):
    nome: Optional[str] = None


class ComandaCreate(ComandaBase):
    mesa_id: int


class ComandaResponse(ComandaBase):
    id: int
    mesa_id: int
    status: str
    criada_em: datetime

    class Config:
        from_attributes = True
