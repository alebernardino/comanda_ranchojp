import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.getcwd(), 'app/database/comanda.db')

def populate():
    if not os.path.exists(DB_PATH):
        print(f"Erro: Banco de dados não encontrado em {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    hoje = datetime.now().strftime('%Y-%m-%d')
    agora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    print(f"Populando base para o dia: {hoje}")

    # --- 1. COMANDAS E ITENS ---
    # Comanda #101
    cursor.execute("INSERT INTO comandas (numero, nome, status, finalizada_em) VALUES (?, ?, ?, ?)", 
                   (101, 'Cliente Teste 1', 'finalizada', agora))
    c1_id = cursor.lastrowid
    
    itens_c1 = [
        ('001', 'Cerveja Skol 600ml', 2, 15.0, 30.0),
        ('002', 'Pote de Azeitona', 1, 10.0, 10.0),
        ('003', 'Porção de Batata', 1, 35.0, 35.0)
    ]
    for item in itens_c1:
        cursor.execute("INSERT INTO itens_comanda (comanda_id, codigo, descricao, quantidade, valor, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
                       (c1_id, item[0], item[1], item[2], item[3], item[4]))

    # Pagamento C1: Crédito
    cursor.execute("INSERT INTO pagamentos (comanda_id, forma, valor) VALUES (?, ?, ?)", (c1_id, 'Crédito', 75.0))

    # Comanda #102
    cursor.execute("INSERT INTO comandas (numero, nome, status, finalizada_em) VALUES (?, ?, ?, ?)", 
                   (102, 'Cliente Teste 2', 'finalizada', agora))
    c2_id = cursor.lastrowid
    
    itens_c2 = [
        ('004', 'Suco de Laranja', 1, 12.0, 12.0),
        ('005', 'X-Salada', 1, 28.0, 28.0)
    ]
    for item in itens_c2:
        cursor.execute("INSERT INTO itens_comanda (comanda_id, codigo, descricao, quantidade, valor, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
                       (c2_id, item[0], item[1], item[2], item[3], item[4]))

    # Pagamento C2: Dinheiro
    cursor.execute("INSERT INTO pagamentos (comanda_id, forma, valor) VALUES (?, ?, ?)", (c2_id, 'Dinheiro', 40.0))

    # Comanda #103
    cursor.execute("INSERT INTO comandas (numero, nome, status, finalizada_em) VALUES (?, ?, ?, ?)", 
                   (103, 'Cliente Teste 3', 'finalizada', agora))
    c3_id = cursor.lastrowid
    
    itens_c3 = [
        ('001', 'Cerveja Skol 600ml', 4, 15.0, 60.0),
        ('006', 'Água Mineral', 2, 5.0, 10.0)
    ]
    for item in itens_c3:
        cursor.execute("INSERT INTO itens_comanda (comanda_id, codigo, descricao, quantidade, valor, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
                       (c3_id, item[0], item[1], item[2], item[3], item[4]))

    # Pagamento C3: Pix
    cursor.execute("INSERT INTO pagamentos (comanda_id, forma, valor) VALUES (?, ?, ?)", (c3_id, 'Pix', 70.0))

    # --- 2. FINANCEIRO (SAÍDAS) ---
    saidas = [
        (hoje, 'Distribuidora Bebidas', 'Compra Refri/Cerveja', 150.0, 'Pix', 1),
        (hoje, 'Açougue Central', 'Carne para Porções', 85.50, 'Crédito', 1)
    ]
    for s in saidas:
        cursor.execute("INSERT INTO pagamentos_gerais (data, nome, item_servico, valor, forma_pagamento, pago) VALUES (?, ?, ?, ?, ?, ?)",
                       (s[0], s[1], s[2], s[3], s[4], s[5]))

    conn.commit()
    conn.close()
    print("Base populada com sucesso!")

if __name__ == "__main__":
    populate()
