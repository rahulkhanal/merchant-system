# ADR-001: Hexagonal Architecture (Ports and Adapters)

**Date:** 2026-11-22  
**Status:** Accepted

## Context

The merchant API needs to process merchant applications through multiple external integrations (KYB provider, database, job queue). Business rules must remain testable in isolation without requiring real infrastructure, and the system needs to swap adapters independently (e.g. switch queue implementations, change KYB provider).

## Decision

Adopt hexagonal architecture with three layers per module:

- **Domain** — pure business logic and state machine (no framework imports)
- **Application** — use cases and abstract port interfaces
- **Infrastructure** — TypeORM repositories, BullMQ queue, HTTP clients (implement ports)
- **Presentation** — NestJS controllers (drive the application layer)

Domain objects use a private constructor and `static reconstitute()` to prevent construction outside the layer. Repository ports are abstract classes (not interfaces) so NestJS DI can inject them by token.

## Consequences

**Positive**
- Domain and use-case unit tests require no database or queue setup
- Swapping the KYB provider or queue backend only touches the infrastructure adapter
- State-machine transitions (`submit`, `approve`, `reject`, etc.) are enforced in one place

**Negative**
- More files and indirection than a simple CRUD approach
- NestJS decorators cannot be used in domain classes, requiring explicit `type: 'varchar'` on all entity columns (rspack strips decorator metadata)
