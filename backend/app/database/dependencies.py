from fastapi import HTTPException
from app.database.connection import get_connection
import sqlite3

def get_db():
    db = get_connection()
    try:
        yield db
    finally:
        db.close()

def get_comanda_resumo_logic(cursor, comanda_id):
    # Total de itens
    cursor.execute(
        "SELECT COALESCE(SUM(subtotal), 0) as total_itens FROM itens_comanda WHERE comanda_id = ?",
        (comanda_id,),
    )
    total_itens = cursor.fetchone()["total_itens"]

    # Total de pagamentos
    cursor.execute(
        "SELECT COALESCE(SUM(valor), 0) as total_pago FROM pagamentos WHERE comanda_id = ?",
        (comanda_id,),
    )
    total_pago = cursor.fetchone()["total_pago"]

    saldo = total_pago - total_itens
    return total_itens, total_pago, saldo
