"""Use the Windows certificate store for HTTPS requests in this environment."""

try:
    import truststore

    truststore.inject_into_ssl()
except Exception:
    # Keep Python startup usable if the optional TLS integration is unavailable.
    pass
