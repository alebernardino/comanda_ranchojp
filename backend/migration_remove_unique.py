import sqlite3
import os

db_path = "/home/ale_bernardino/code/comanda/comanda_ranchojp/backend/app/database/comanda.db"

def migrate_remove_unique_constraint():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Starting migration to remove UNIQUE constraint from comandas.numero...")
    
    # 1. Rename existing table
    try:
        cursor.execute("ALTER TABLE comandas RENAME TO comandas_old")
    except sqlite3.OperationalError as e:
        if "no such table: comandas" in str(e):
             print("Table comandas not found, skipping rename.")
        else:
             raise e

    # 2. Create new table without UNIQUE constraint on numero
    # Note: verify other columns match schema.sql
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comandas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero INTEGER NOT NULL,
        nome TEXT,
        telefone TEXT,
        status TEXT NOT NULL DEFAULT 'aberta',
        criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        finalizada_em DATETIME
    );
    """)
    
    # 3. Copy data from old table to new table
    cursor.execute("""
    INSERT INTO comandas (id, numero, nome, telefone, status, criada_em, finalizada_em)
    SELECT id, numero, nome, telefone, status, criada_em, finalizada_em FROM comandas_old
    """)
    
    # 4. Drop old table
    cursor.execute("DROP TABLE comandas_old")
    
    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    if os.path.exists(db_path):
        migrate_remove_unique_constraint()
    else:
        print(f"Database not found at {db_path}")
