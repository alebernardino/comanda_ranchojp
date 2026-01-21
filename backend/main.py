from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import comandas, produtos, itens_comanda, pagamentos, colaboradores, financeiro, relatorios, clientes, estoque, licenca, configuracao, auth, usuarios
from app.database.init_db import init_db
from app.license import validar_licenca
from app.database.connection import get_connection
from app.auth import buscar_usuario_por_sessao

app = FastAPI(title="Comanda Rancho JP")

# 🔥 CORS (ESSENCIAL PARA O FRONTEND)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_origin_regex=r"^http://[^/]+:5500$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

def _cors_error_response(request: Request, status_code: int, content: dict) -> JSONResponse:
    resp = JSONResponse(status_code=status_code, content=content)
    origin = request.headers.get("origin")
    if origin:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Vary"] = "Origin"
    return resp

@app.middleware("http")
async def enforce_license(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    if request.url.path in ("/", "/licenca/status", "/licenca/instalar", "/auth/login", "/auth/logout", "/auth/me"):
        return await call_next(request)

    status = validar_licenca()
    if not status.valid:
        return _cors_error_response(
            request,
            status_code=403,
            content={"detail": "Licença expirada ou inválida", "motivo": status.reason},
        )
    return await call_next(request)

@app.middleware("http")
async def enforce_auth(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    if request.url.path in ("/", "/auth/login", "/auth/logout", "/auth/me", "/licenca/status", "/licenca/instalar"):
        return await call_next(request)

    token = request.cookies.get("session_id")
    if not token:
        return _cors_error_response(request, status_code=401, content={"detail": "nao_autenticado"})

    db = get_connection()
    try:
        user = buscar_usuario_por_sessao(db, token)
    finally:
        db.close()

    if not user:
        return _cors_error_response(request, status_code=401, content={"detail": "nao_autenticado"})

    request.state.user = user
    return await call_next(request)

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
app.include_router(clientes.router)
app.include_router(estoque.router)
app.include_router(licenca.router)
app.include_router(configuracao.router)
app.include_router(auth.router)
app.include_router(usuarios.router)
