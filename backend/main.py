from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import comandas, produtos, itens_comanda, pagamentos, colaboradores

app = FastAPI(title="Comanda Rancho JP")

# 🔥 CORS (ESSENCIAL PARA O FRONTEND)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas as origens (incluindo file://)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# rotas
app.include_router(comandas.router)
app.include_router(produtos.router)
app.include_router(itens_comanda.router)
app.include_router(pagamentos.router)
app.include_router(colaboradores.router)
