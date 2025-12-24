from fastapi import FastAPI
from app.api import comandas, produtos, itens_comanda, pagamentos

app = FastAPI(
    title="Comanda Rancho JP",
    description="Sistema de comandas para restaurante (offline)",
    version="0.1.0"
)

app.include_router(comandas.router)
app.include_router(produtos.router)
app.include_router(itens_comanda.router)
app.include_router(pagamentos.router)



@app.get("/")
def root():
    return {
        "status": "ok",
        "mensagem": "API da Comanda Rancho JP está rodando"
    }
