import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'app/database/comanda.db')

def check():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- COMANDAS ABERTAS COM CONTEUDO ---")
    cursor.execute("""
        SELECT id, numero, nome, telefone 
        FROM comandas 
        WHERE status = 'aberta'
        AND (
            (nome IS NOT NULL AND nome != '')
            OR (telefone IS NOT NULL AND telefone != '')
            OR EXISTS (SELECT 1 FROM itens_comanda ic WHERE ic.comanda_id = comandas.id)
        )
    """)
    rows = cursor.fetchall()
    print(f"Total: {len(rows)}")
    for r in rows:
        print(dict(r))
        
    conn.close()

if __name__ == "__main__":
    check()
