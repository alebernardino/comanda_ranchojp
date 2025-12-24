from pydantic import BaseModel


class ProdutoBase(BaseModel):
    codigo: str
    descricao: str
    valor: float
    ativo: bool = True


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoResponse(ProdutoBase):
    id: int

    class Config:
        from_attributes = True
