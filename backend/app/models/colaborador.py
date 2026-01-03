from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ColaboradorBase(BaseModel):
    nome: str
    endereco: Optional[str] = None
    contatos: Optional[List[str]] = []
    pixs: Optional[List[str]] = []
    funcao: Optional[str] = None
    ativo: Optional[bool] = True

class ColaboradorCreate(ColaboradorBase):
    pass

class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    endereco: Optional[str] = None
    contatos: Optional[List[str]] = None
    pixs: Optional[List[str]] = None
    funcao: Optional[str] = None
    ativo: Optional[bool] = None

class Colaborador(ColaboradorBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
