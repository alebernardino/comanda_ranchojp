#!/usr/bin/env python3
import base64
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization


def main():
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )

    private_b64 = base64.b64encode(private_bytes).decode("utf-8")
    public_b64 = base64.b64encode(public_bytes).decode("utf-8")

    Path("licenca_private_key.b64").write_text(private_b64, encoding="utf-8")
    Path("licenca_public_key.b64").write_text(public_b64, encoding="utf-8")

    print("Chaves geradas:")
    print("- licenca_private_key.b64 (NÃO COMPARTILHAR)")
    print("- licenca_public_key.b64 (incluir no sistema)")


if __name__ == "__main__":
    main()
