import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'app/database/comanda.db')

def check():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("--- ULTIMAS COMANDAS ---")
    cursor.execute("SELECT id, numero, status, finalizada_em FROM comandas ORDER BY id DESC LIMIT 5")
    for r in cursor.fetchall():
        print(r)
        
    print("\n--- ULTIMOS ITENS ---")
    cursor.execute("SELECT id, comanda_id, descricao, subtotal FROM itens_comanda ORDER BY id DESC LIMIT 5")
    for r in cursor.fetchall():
        print(r)
        
    conn.close()

if __name__ == "__main__":
    check()
