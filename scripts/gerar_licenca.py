#!/usr/bin/env python3
import argparse
import base64
import json
from datetime import datetime
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cliente", required=True)
    parser.add_argument("--expira", required=True, help="YYYY-MM-DD ou ISO")
    parser.add_argument("--chave-privada", required=True, help="Arquivo .b64")
    parser.add_argument("--plano", default="total", choices=["essencial", "total"])
    parser.add_argument("--saida", default="licenca.json")
    args = parser.parse_args()

    private_b64 = Path(args.chave_privada).read_text(encoding="utf-8").strip()
    private_key = Ed25519PrivateKey.from_private_bytes(base64.b64decode(private_b64))

    payload = {
        "cliente": args.cliente,
        "emitida_em": datetime.now().strftime("%Y-%m-%d"),
        "expira_em": args.expira,
        "plano": args.plano,
    }

    msg = f"{payload['cliente']}|{payload['emitida_em']}|{payload['expira_em']}|{payload['plano']}".encode("utf-8")
    assinatura = base64.b64encode(private_key.sign(msg)).decode("utf-8")
    payload["assinatura"] = assinatura

    Path(args.saida).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Licenca gerada em: {args.saida}")


if __name__ == "__main__":
    main()
