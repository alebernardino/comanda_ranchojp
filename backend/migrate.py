import sqlite3
import os

db_path = "/home/ale_bernardino/code/comanda/comanda_ranchojp/backend/app/database/comanda.db"

def check_column():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(itens_comanda)")
    columns = [row[1] for row in cursor.fetchall()]
    conn.close()
    print(f"Columns in itens_comanda: {columns}")
    return "quantidade_paga" in columns

def add_column():
    if not check_column():
        print("Adding column quantidade_paga...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE itens_comanda ADD COLUMN quantidade_paga REAL DEFAULT 0")
        conn.commit()
        conn.close()
        print("Column added successfully.")
    else:
        print("Column already exists.")

if __name__ == "__main__":
    add_column()
