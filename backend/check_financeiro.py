import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'app/database/comanda.db')

def check():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- PAGAMENTOS GERAIS (FINANCEIRO) ---")
    cursor.execute("SELECT id, data, nome, valor, pago FROM pagamentos_gerais ORDER BY id DESC LIMIT 10")
    for r in cursor.fetchall():
        print(dict(r))
        
    conn.close()

if __name__ == "__main__":
    check()
