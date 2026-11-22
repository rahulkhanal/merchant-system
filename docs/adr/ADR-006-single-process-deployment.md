# ADR-006: Single-Process Deployment (API + Worker Merged)

**Date:** 2026-11-22  
**Status:** Accepted

## Context

Initially the project had two separate NestJS entry points: `main.ts` (HTTP API) and `worker.ts` (BullMQ processor). This required two Docker services, two build outputs, and two TypeORM configurations — duplicating entity registration and database connection setup.

## Decision

Merge the BullMQ worker (`ProcessRiskReviewProcessor`, `StalledReviewSweep`, `KybHttpClient`) into the main API process by registering them as providers in `MerchantApplicationsModule`.

One Docker service (`api`) runs both the HTTP server and the queue processor.

## Consequences

**Positive**
- One Docker image, one process, simpler Docker Compose
- No duplicated TypeORM/Redis configuration
- Easier local development — `pnpm start:dev` runs everything
- Shared DI container — no cross-process communication needed

**Negative**
- CPU-heavy KYB processing shares the event loop with HTTP request handling
- Cannot scale the worker independently of the API
- A crash takes down both API and worker simultaneously

**When to split back:** If KYB volume causes measurable API latency degradation, extract the processor back to a separate process. The port/adapter design makes this mechanical — only the module wiring changes.
