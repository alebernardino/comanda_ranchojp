from pathlib import Path
from .connection import get_connection


def init_db():
    """
    Inicializa o banco de dados executando o schema.sql.
    Cria todas as tabelas caso ainda não existam.
    """
    # Caminho do arquivo schema.sql
    base_dir = Path(__file__).resolve().parent
    schema_path = base_dir / "schema.sql"

    # Conecta ao banco
    conn = get_connection()
    cursor = conn.cursor()

    # Executa o schema
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Banco de dados inicializado com sucesso.")
