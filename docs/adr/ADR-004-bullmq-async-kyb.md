# ADR-004: BullMQ + Redis for Asynchronous KYB Processing

**Date:** 2026-11-22  
**Status:** Accepted

## Context

KYB (Know Your Business) risk review involves an external HTTP call to a third-party provider. This call can be slow (seconds) or fail transiently. Blocking the HTTP request thread while waiting for the KYB result would degrade API responsiveness and leave the caller waiting unnecessarily.

## Decision

Process KYB asynchronously using **BullMQ** backed by **Redis**.

**Flow:**
1. `POST /merchants/:id/submit` — transitions application to `SUBMITTED`, enqueues a job, returns `202 Accepted` immediately
2. `ProcessRiskReviewProcessor` (BullMQ worker, same process) picks up the job, calls `KybProviderPort`
3. On success — calls `app.recordRiskAssessment(outcome, reference, checkedAt)`, persists, transitions to `UNDER_REVIEW`
4. On failure — calls `app.markRiskReviewFailed()`, BullMQ retries with exponential backoff

**Retry policy:** 4 attempts, exponential backoff starting at 1s (1s → 2s → 4s → 8s)

**Stalled job sweep:** A `@Cron` job runs every 60 seconds, finds applications with `riskStatus = PENDING` and `updatedAt < now - 5min`, and re-enqueues them. Guards against jobs lost to process restart before completion.

**Single process:** The BullMQ worker (`ProcessRiskReviewProcessor`) runs in the same NestJS process as the API server. No separate worker deployment.

## Consequences

**Positive**
- Submit endpoint returns immediately — no blocking on external HTTP
- Automatic retries with backoff handle transient KYB provider failures
- Stalled sweep catches jobs lost to crashes or restarts
- BullMQ persists jobs in Redis — survive process restarts

**Negative**
- Redis is now a required dependency for the API to start
- Single-process means high KYB load competes with API request handling (acceptable for current scale)
- At scale, the worker should be extracted to a separate process/service
- Failed jobs (after 4 attempts) require manual ADMIN retry via `POST /merchants/:id/retry-risk`
