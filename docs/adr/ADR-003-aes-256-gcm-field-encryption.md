# ADR-003: AES-256-GCM Field-Level Encryption for Sensitive Data

**Date:** 2026-11-22  
**Status:** Accepted

## Context

Merchant applications contain sensitive personal and financial data: SSN, date of birth, tax ID, bank account number, routing number. This data must be protected at rest so that a database compromise does not expose plaintext PII.

Options considered:
1. **Column-level DB encryption** (e.g. `pgcrypto`) — encryption in the database layer
2. **Full-disk encryption only** — protects against physical theft, not DB-level access
3. **Application-level field encryption** — each sensitive value encrypted before writing to DB

## Decision

Encrypt sensitive fields in the application layer using **AES-256-GCM** via Node.js's built-in `node:crypto` module before persisting to PostgreSQL.

**Encrypted fields:** `bankAccountNumber`, `routingNumber`, `ownerInfo.ssn`, `ownerInfo.dateOfBirth`, `ownerInfo.taxId`

**Format:** `enc:v1:{iv_hex}:{auth_tag_hex}:{ciphertext_hex}`

- 12-byte random IV per encryption (GCM standard)
- 16-byte authentication tag (detects tampering)
- Versioned prefix (`enc:v1:`) allows future key rotation with backward-compatible decryption

**Key management:** 32-byte key from `FIELD_ENCRYPTION_KEY` env var (hex-encoded). Key must be rotated by re-encrypting stored values.

**API responses:** Sensitive fields are masked before returning (`****1234` for bank account, `***-**-1234` for SSN, `[REDACTED]` for routing number and DOB).

## Consequences

**Positive**
- Sensitive data is unreadable from a raw DB dump
- GCM mode provides authenticated encryption — tampering is detectable
- Versioned format allows future key rotation without downtime

**Negative**
- `createCipheriv`/`createDecipheriv`/`randomBytes` are synchronous on the main thread — acceptable for small fields (< 5µs each) but would need worker threads for large payloads
- DB-level querying on encrypted fields is impossible (no `WHERE bankAccountNumber = ?`)
- Key rotation requires a re-encryption migration across all existing rows
- `FIELD_ENCRYPTION_KEY` must be managed as a secret (not committed)
