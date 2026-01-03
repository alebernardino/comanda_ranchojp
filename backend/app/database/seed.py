import sqlite3
import random
from datetime import datetime, timedelta
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "comanda.db"

def seed():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Limpando dados existentes (opcional)...")
    # Uncomment if you want a clean seed every time
    # cursor.execute("DELETE FROM itens_comanda")
    # cursor.execute("DELETE FROM pagamentos")
    # cursor.execute("DELETE FROM comandas")
    # cursor.execute("DELETE FROM produtos")
    # cursor.execute("DELETE FROM colaboradores")
    # cursor.execute("DELETE FROM pagamentos_gerais")

    # 1. Produtos
    print("Semeando produtos...")
    produtos = [
        ("101", "X-Salada", 22.50),
        ("102", "X-Burguer", 18.00),
        ("103", "X-Bacon", 25.00),
        ("104", "X-Tudo", 32.00),
        ("201", "Cerveja Lata", 7.00),
        ("202", "Refrigerante Lata", 6.00),
        ("203", "Suco Natural", 9.00),
        ("204", "Água Mineral", 4.00),
        ("301", "Porção Batata Frita", 28.00),
        ("302", "Porção Calabresa", 35.00),
        ("303", "Porção Isca de Peixe", 45.00),
        ("401", "Pudim de Leite", 12.00),
    ]
    for cod, desc, val in produtos:
        try:
            cursor.execute("INSERT INTO produtos (codigo, descricao, valor, ativo) VALUES (?, ?, ?, 1)", (cod, desc, val))
        except sqlite3.IntegrityError:
            pass # Já existe

    # 2. Colaboradores
    print("Semeando colaboradores...")
    colaboradores = [
        ("Ricardo Silva", "Rua A, 123", ["(11) 99999-0001"], ["ricardo@pix.com"], "Garçom"),
        ("Maria Oliveira", "Av B, 456", ["(11) 99999-0002"], ["maria@pix.com"], "Cozinha"),
        ("Carlos Santos", "Rua C, 789", ["(11) 99999-0003"], ["carlos@pix.com"], "Churrasqueiro"),
        ("Ana Souza", "Rua D, 101", ["(11) 99999-0004"], ["ana@pix.com"], "Atendente"),
    ]
    for nome, end, cont, pix, func in colaboradores:
        cursor.execute(
            "INSERT INTO colaboradores (nome, endereco, contatos, pixs, funcao, ativo) VALUES (?, ?, ?, ?, ?, 1)",
            (nome, end, json.dumps(cont), json.dumps(pix), func)
        )

    # 3. Financeiro (Pagamentos Gerais)
    print("Semeando financeiro...")
    for i in range(20):
        data = datetime.now() - timedelta(days=random.randint(0, 30))
        fornecedor = random.choice(["Distribuidora Bebidas", "Mercado Central", "Açougue do Zé", "Padaria Silva", "Energia Elétrica", "Aluguel Salão"])
        item = random.choice(["Reposicão de Estoque", "Pagamento de Conta", "Compra de Insumos", "Serviços de Manutenção"])
        valor = random.uniform(50.0, 1500.0)
        pago = random.choice([0, 1])
        forma = random.choice(["Pix", "Boleto", "Dinheiro", "Cartão Débito"])
        cursor.execute(
            "INSERT INTO pagamentos_gerais (data, nome, item_servico, valor, forma_pagamento, pago) VALUES (?, ?, ?, ?, ?, ?)",
            (data.isoformat(), fornecedor, item, valor, forma, pago)
        )

    # 4. Comandas e Itens
    print("Semeando comandas e itens...")
    for i in range(1, 51): # 50 comandas
        numero = random.randint(100, 999)
        nome_cliente = random.choice(["João", "Paula", "André", "Beatriz", "Roberto", "Cláudia", None])
        status = random.choice(["aberta", "finalizada"])
        
        dias_atras = random.randint(0, 30)
        data_criacao = datetime.now() - timedelta(days=dias_atras, hours=random.randint(1, 10))
        data_finalizacao = None
        if status == "finalizada":
            data_finalizacao = data_criacao + timedelta(minutes=random.randint(30, 180))

        try:
            cursor.execute(
                "INSERT INTO comandas (numero, nome, status, criada_em, finalizada_em) VALUES (?, ?, ?, ?, ?)",
                (numero, nome_cliente, status, data_criacao.isoformat(), data_finalizacao.isoformat() if data_finalizacao else None)
            )
            comanda_id = cursor.lastrowid

            # Adicionar itens
            num_itens = random.randint(1, 8)
            total_comanda = 0
            for _ in range(num_itens):
                prod = random.choice(produtos)
                qtd = random.randint(1, 4)
                subtotal = qtd * prod[2]
                total_comanda += subtotal
                cursor.execute(
                    "INSERT INTO itens_comanda (comanda_id, codigo, descricao, quantidade, valor, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
                    (comanda_id, prod[0], prod[1], qtd, prod[2], subtotal)
                )

            # Se finalizada, adicionar pagamentos
            if status == "finalizada":
                forma = random.choice(["Dinheiro", "Pix", "Cartão Crédito", "Cartão Débito"])
                cursor.execute(
                    "INSERT INTO pagamentos (comanda_id, forma, valor) VALUES (?, ?, ?)",
                    (comanda_id, forma, total_comanda)
                )
        except sqlite3.IntegrityError:
            continue # Numero duplicado, pula

    conn.commit()
    conn.close()
    print("Seed finalizado com sucesso!")

if __name__ == "__main__":
    seed()
