import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "comanda.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
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
        
    conn.close()

if __name__ == "__main__":
    migrate()
