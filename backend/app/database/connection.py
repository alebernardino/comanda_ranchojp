import sqlite3
from pathlib import Path

# Diretório base (app/database)
BASE_DIR = Path(__file__).resolve().parent

# Caminho do arquivo do banco
DB_PATH = BASE_DIR / "comanda.db"


def get_connection():
    """
    Retorna uma conexão com o banco SQLite.
    Cria o banco automaticamente se não existir.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
