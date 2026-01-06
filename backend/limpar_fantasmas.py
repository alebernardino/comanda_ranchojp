import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.getcwd(), 'app/database/comanda.db')

def cleanup():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Finaliza todas as comandas abertas que possuem número > 300
    # Essas comandas não aparecem no grid e estavam "sujando" as estatísticas
    cursor.execute("""
        UPDATE comandas 
        SET status = 'finalizada', finalizada_em = ?
        WHERE status = 'aberta' AND numero > 300
    """, (datetime.now(),))
    
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    print(f"Limpeza concluída! {affected} comandas 'fantasmas' (numero > 300) foram finalizadas.")

if __name__ == "__main__":
    cleanup()
