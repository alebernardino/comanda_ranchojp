from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import comandas, produtos, itens_comanda, pagamentos, colaboradores, financeiro, relatorios
from app.database.init_db import init_db

app = FastAPI(title="Comanda Rancho JP")

# 🔥 CORS (ESSENCIAL PARA O FRONTEND)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

# rotas
app.include_router(comandas.router)
app.include_router(produtos.router)
app.include_router(itens_comanda.router)
app.include_router(pagamentos.router)
app.include_router(colaboradores.router)
app.include_router(financeiro.router)
app.include_router(relatorios.router)
