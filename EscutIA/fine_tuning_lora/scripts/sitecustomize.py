"""Use o repositório de certificados do Windows para conexões HTTPS."""

try:
    import truststore

    truststore.inject_into_ssl()
except Exception:
    # O Python continua utilizável caso a integração opcional não esteja disponível.
    pass
