from pydantic import BaseModel


class MesaBase(BaseModel):
    numero: int
    ativa: bool = True


class MesaCreate(MesaBase):
    pass


class MesaResponse(MesaBase):
    id: int

    class Config:
        from_attributes = True
