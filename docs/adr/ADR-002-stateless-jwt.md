# ADR-002: Stateless JWT Authentication (No Server-Side Session)

**Date:** 2026-11-22  
**Status:** Accepted

## Context

The API needs authentication and role-based access control. Options considered:

1. **Stateless JWT** — server signs tokens, validates signature on each request, no lookup
2. **JWT + Redis session** — tokens are signed but also stored in Redis; logout invalidates the server-side entry

## Decision

Use stateless JWT with two tokens:

- **Access token** — 15-minute expiry, signed with `JWT_SECRET`, carries `{ sub, role }`
- **Refresh token** — 7-day expiry, signed with `JWT_REFRESH_SECRET`, carries `{ sub, role, type: 'refresh' }`

`POST /auth/refresh` is guarded by `JwtRefreshGuard` which validates against `JWT_REFRESH_SECRET` and rejects tokens where `type !== 'refresh'`. `POST /auth/logout` is a client-side signal only — the server performs no revocation.

## Consequences

**Positive**
- No Redis dependency for auth hot path
- Horizontally scalable with no shared session state
- Simple implementation

**Negative**
- Tokens cannot be revoked before expiry — a stolen access token is valid for up to 15 minutes
- `POST /auth/logout` is a no-op on the server; true logout relies on the client discarding tokens
- No visibility into active sessions

**Future option:** Add a Redis blocklist keyed on `jti` with TTL equal to remaining token expiry. Check it in `JwtStrategy.validate()`. This restores revocation without full session storage.
