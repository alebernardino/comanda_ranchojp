-- =========================
-- TABELA: comandas
-- =========================
CREATE TABLE IF NOT EXISTS comandas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT,
    telefone TEXT,
    status TEXT NOT NULL DEFAULT 'aberta',
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    finalizada_em DATETIME
);

-- =========================
-- TABELA: produtos
-- =========================
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    ativo INTEGER DEFAULT 1
);

-- =========================
-- TABELA: estoque_produtos
-- =========================
CREATE TABLE IF NOT EXISTS estoque_produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL UNIQUE,
    quantidade REAL NOT NULL DEFAULT 0,
    minimo REAL NOT NULL DEFAULT 0,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
);

-- =========================
-- TABELA: estoque_movimentos
-- =========================
CREATE TABLE IF NOT EXISTS estoque_movimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- entrada, saida, ajuste
    quantidade REAL NOT NULL,
    motivo TEXT,
    origem TEXT, -- compra, comanda, ajuste, avulso
    referencia TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
);

-- =========================
-- TABELA: itens_comanda
-- =========================
CREATE TABLE IF NOT EXISTS itens_comanda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comanda_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    quantidade REAL NOT NULL,
    valor REAL NOT NULL,
    subtotal REAL NOT NULL,
    quantidade_paga REAL DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comanda_id) REFERENCES comandas (id)
);

-- =========================
-- TABELA: pagamentos
-- =========================
CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comanda_id INTEGER NOT NULL,
    forma TEXT NOT NULL,
    valor REAL NOT NULL,
    detalhe TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comanda_id) REFERENCES comandas (id)
);

-- =========================
-- TABELA: colaboradores
-- =========================
CREATE TABLE IF NOT EXISTS colaboradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    endereco TEXT,
    contatos TEXT, -- JSON string
    pixs TEXT, -- JSON string
    funcao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo INTEGER DEFAULT 1
);

-- =========================
-- TABELA: clientes
-- =========================
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL UNIQUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME
);

-- =========================
-- TABELA: pagamentos_gerais (Financeiro)
-- =========================
CREATE TABLE IF NOT EXISTS pagamentos_gerais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATETIME DEFAULT CURRENT_TIMESTAMP,
    nome TEXT NOT NULL,
    item_servico TEXT NOT NULL,
    valor REAL NOT NULL,
    forma_pagamento TEXT,
    pago INTEGER DEFAULT 1, -- 1 para Sim, 0 para Não
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA: usuarios
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'operador',
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA: sessoes
-- =========================
CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);
