-- =========================
-- TABELA: comandas
-- =========================
CREATE TABLE IF NOT EXISTS comandas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER NOT NULL UNIQUE,
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