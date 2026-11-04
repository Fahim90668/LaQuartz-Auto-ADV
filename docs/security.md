# Security

The threat: users hand over real Discord user tokens. A leak = account takeover.
Everything below exists because of that one fact.

## 1. Token encryption

**AES-256-GCM** — authenticated encryption (detects tampering).

| | |
|---|---|
| Key | 32 bytes |
| IV | 12 bytes, unique per encryption |
| Auth tag | 16 bytes |
| Storage | `token_ciphertext`, `token_iv`, `token_tag` (bytea) + `key_version` |

**Encrypt:**