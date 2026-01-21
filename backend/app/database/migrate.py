import sqlite3
from pathlib import Path
from datetime import datetime
import bcrypt

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "comanda.db"

def _gerar_codigo_comanda(numero: int, criada_em: str | None) -> str:
    if criada_em:
        try:
            dt = datetime.fromisoformat(criada_em.replace("Z", ""))
            return f"{numero}-{dt.strftime('%Y%m%d%H%M%S')}"
        except ValueError:
            pass
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{numero}-{timestamp}"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check columns in pagamentos_gerais
    cursor.execute("PRAGMA table_info(pagamentos_gerais)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'pago' not in columns:
        print("Adicionando coluna 'pago' em pagamentos_gerais...")
        cursor.execute("ALTER TABLE pagamentos_gerais ADD COLUMN pago INTEGER DEFAULT 1")
        conn.commit()
        print("Coluna 'pago' adicionada com sucesso.")
    else:
        print("Coluna 'pago' já existe em pagamentos_gerais.")

    # Criar tabela clientes se não existir
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL UNIQUE,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME
        )
        """
    )

    # Tabelas de estoque
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS estoque_produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL UNIQUE,
            quantidade REAL NOT NULL DEFAULT 0,
            minimo REAL NOT NULL DEFAULT 0,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produto_id) REFERENCES produtos (id)
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS estoque_movimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            quantidade REAL NOT NULL,
            motivo TEXT,
            origem TEXT,
            referencia TEXT,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produto_id) REFERENCES produtos (id)
        )
        """
    )

    # Backfill estoque_produtos para produtos existentes
    cursor.execute("SELECT id FROM produtos")
    produtos = cursor.fetchall()
    for p in produtos:
        cursor.execute(
            "INSERT OR IGNORE INTO estoque_produtos (produto_id, quantidade, minimo) VALUES (?, 0, 0)",
            (p["id"],),
        )
    conn.commit()

    # Tabelas de usuarios e sessoes
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            perfil TEXT NOT NULL DEFAULT 'operador',
            ativo INTEGER DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sessoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            expira_em DATETIME NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
        """
    )
    conn.commit()

    # Criar usuario admin padrao se nao existir
    cursor.execute("SELECT id FROM usuarios LIMIT 1")
    if not cursor.fetchone():
        senha_padrao = "admin123"
        senha_hash = bcrypt.hashpw(senha_padrao.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            "INSERT INTO usuarios (username, senha_hash, perfil, ativo) VALUES (?, ?, 'admin', 1)",
            ("admin", senha_hash),
        )
        conn.commit()
        print("Usuario admin criado: admin / admin123")

    # Migração da tabela comandas: remover UNIQUE de numero e adicionar coluna codigo
    cursor.execute("PRAGMA table_info(comandas)")
    colunas_comandas = [row[1] for row in cursor.fetchall()]
    if 'codigo' not in colunas_comandas:
        print("Recriando tabela 'comandas' para adicionar 'codigo' e permitir reuso de numero...")
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS comandas_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero INTEGER NOT NULL,
                codigo TEXT NOT NULL UNIQUE,
                nome TEXT,
                telefone TEXT,
                status TEXT NOT NULL DEFAULT 'aberta',
                criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                finalizada_em DATETIME
            )
            """
        )
        cursor.execute("SELECT id, numero, nome, telefone, status, criada_em, finalizada_em FROM comandas")
        rows = cursor.fetchall()
        for row in rows:
            codigo = _gerar_codigo_comanda(row["numero"], row["criada_em"])
            cursor.execute(
                """
                INSERT INTO comandas_new (id, numero, codigo, nome, telefone, status, criada_em, finalizada_em)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row["id"],
                    row["numero"],
                    codigo,
                    row["nome"],
                    row["telefone"],
                    row["status"],
                    row["criada_em"],
                    row["finalizada_em"],
                ),
            )
        cursor.execute("DROP TABLE comandas")
        cursor.execute("ALTER TABLE comandas_new RENAME TO comandas")
        conn.commit()
        print("Tabela 'comandas' migrada com sucesso.")
    else:
        print("Tabela 'comandas' já possui coluna 'codigo'.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
