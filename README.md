# Comanda Rancho JP

Sistema de comandas para controle de pedidos e pagamentos em restaurantes.

## 🚀 Tecnologias

**Backend:**
- Python 3.x
- FastAPI
- SQLite

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Chart.js (gráficos)
- QZ Tray (impressão térmica)

## 📋 Funcionalidades

- ✅ Grid de 300 comandas com status em tempo real
- ✅ Adicionar/remover itens
- ✅ Divisão por pessoa ou por item
- ✅ Múltiplas formas de pagamento
- ✅ Impressão térmica (via QZ Tray)
- ✅ Cadastro de produtos e colaboradores
- ✅ Relatórios de vendas e fluxo de caixa
- ✅ Fechamento diário

## 🛠️ Instalação

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Frontend

Não requer instalação. Servido via HTTP server.

## ▶️ Executando

### 1. Iniciar Backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload
```
API disponível em: http://localhost:8000

### 2. Iniciar Frontend

```bash
cd frontend
python -m http.server 5500
```
Sistema disponível em: http://localhost:5500

## 📁 Estrutura do Projeto

```
comanda_ranchojp/
├── backend/
│   ├── app/
│   │   ├── api/         # Rotas (comandas, produtos, pagamentos...)
│   │   ├── database/    # Conexão e queries SQLite
│   │   └── models/      # Modelos de dados
│   ├── scripts/         # Migrations e seeds
│   └── main.py
├── frontend/
│   ├── css/             # Estilos
│   ├── js/              # Módulos JavaScript
│   │   ├── api.js       # Funções centralizadas de API
│   │   ├── dashboard.js # Grid de comandas
│   │   ├── comanda.js   # Gerenciamento de comanda
│   │   ├── pagamento.js # Modal de pagamento
│   │   └── ...
│   ├── templates/       # HTML injetado dinamicamente
│   └── index.html
└── README.md
```

## 🔧 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/comandas/` | Lista todas as comandas |
| POST | `/comandas/garantir/{n}` | Cria/abre comanda N |
| GET | `/comandas/{n}/itens` | Itens da comanda |
| POST | `/comandas/{n}/itens` | Adiciona item |
| POST | `/comandas/{n}/pagamentos` | Registra pagamento |
| POST | `/comandas/{n}/fechar` | Finaliza comanda |
| GET | `/produtos/` | Lista produtos |
| GET | `/relatorios/vendas` | Relatório de vendas |

## 📊 Fluxo do Sistema

1. **Abrir comanda** → Clica no número ou digita no campo rápido
2. **Adicionar itens** → Busca por código ou descrição
3. **Pagamento** → Seleciona forma e registra valor
4. **Finalizar** → Confirma e imprime comprovante (opcional)

## 👥 Autor

Desenvolvido para o Restaurante Rancho JP.
