import sqlite3
from pathlib import Path
from datetime import datetime

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
