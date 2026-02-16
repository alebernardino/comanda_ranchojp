from pathlib import Path
from .connection import get_connection
from app.passwords import hash_password


DEFAULT_PRODUCTS = [
    ("101", "X-Salada", 22.50),
    ("102", "X-Burguer", 18.00),
    ("103", "X-Bacon", 25.00),
    ("104", "X-Tudo", 32.00),
    ("201", "Cerveja Lata", 7.00),
    ("202", "Refrigerante Lata", 6.00),
    ("203", "Suco Natural", 9.00),
    ("204", "Agua Mineral", 4.00),
    ("301", "Porcao Batata Frita", 28.00),
    ("302", "Porcao Calabresa", 35.00),
    ("303", "Porcao Isca de Peixe", 45.00),
    ("401", "Pudim de Leite", 12.00),
]


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

    # Se nao houver produtos, carrega um catalogo inicial.
    cursor.execute("SELECT COUNT(*) AS total FROM produtos")
    total_produtos = cursor.fetchone()["total"]
    if int(total_produtos or 0) == 0:
        for codigo, descricao, valor in DEFAULT_PRODUCTS:
            cursor.execute(
                "INSERT INTO produtos (codigo, descricao, valor, ativo) VALUES (?, ?, ?, 1)",
                (codigo, descricao, valor),
            )
        conn.commit()

        cursor.execute("SELECT id FROM produtos")
        for row in cursor.fetchall():
            cursor.execute(
                "INSERT OR IGNORE INTO estoque_produtos (produto_id, quantidade, minimo) VALUES (?, 0, 0)",
                (row["id"],),
            )
        conn.commit()

    # Garante usuario padrao com acesso total.
    senha_hash = hash_password("123456")
    cursor.execute("SELECT id FROM usuarios WHERE username = ?", ("jp",))
    row = cursor.fetchone()
    if row:
        cursor.execute(
            "UPDATE usuarios SET senha_hash = ?, perfil = 'admin', ativo = 1 WHERE id = ?",
            (senha_hash, row["id"]),
        )
    else:
        cursor.execute(
            "INSERT INTO usuarios (username, senha_hash, perfil, ativo) VALUES (?, ?, 'admin', 1)",
            ("jp", senha_hash),
        )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Banco de dados inicializado com sucesso.")
