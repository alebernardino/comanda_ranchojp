from fastapi import FastAPI

app = FastAPI(
    title="Comanda Rancho JP",
    description="Sistema de comandas para restaurante (offline)",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "status": "ok",
        "mensagem": "API da Comanda Rancho JP está rodando"
    }
