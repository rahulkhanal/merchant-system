# merchant API Reference

Payment Service Provider API — base URL `http://localhost:3000`

Interactive docs: `http://localhost:3000/docs`

---

## Roles

| Role | Description |
|------|-------------|
| `SALES` | Creates and manages their own merchant applications |
| `REVIEWER` | Reviews submitted applications and records decisions |
| `ADMIN` | Full access — assigns reviewers, retries risk checks, reads audit logs |

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Tokens are stateless JWTs. Access tokens expire in **15 minutes**; refresh tokens in **7 days**.

---

## Endpoints

### Auth

#### `POST /auth/register`

Create a new user account. Returns a token pair immediately.

**Access:** Public

**Request body:**
```json
{
  "email": "sales@example.com",
  "password": "supersecret123",
  "role": "SALES"           // "SALES" | "REVIEWER" | "ADMIN"
}
```

**Response `201`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errors:** `409 Conflict` — email already registered.

---

#### `POST /auth/login`

Authenticate with email and password.

**Access:** Public

**Request body:**
```json
{
  "email": "sales@example.com",
  "password": "supersecret123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errors:** `401 Unauthorized` — invalid credentials.

---

#### `POST /auth/refresh`

Exchange a refresh token for a new token pair.

**Access:** Public

**Request body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:** Same shape as login.

**Errors:** `401 Unauthorized` — token invalid or expired.

---

#### `POST /auth/logout`

Signal logout. Stateless — no server-side revocation. Client must discard both tokens.

**Access:** Any authenticated user (`SALES` | `REVIEWER` | `ADMIN`)

**Response `204`:** No content.

---

### Merchant Applications

#### `POST /merchants`

Create a new blank application in `DRAFT` status.

**Access:** `SALES`

**Response `201`:** [MerchantApplication](#merchantapplication-object)

---

#### `GET /merchants`

List applications. Results are scoped to the caller's role:

| Role | Returns |
|------|---------|
| `SALES` | Only their own applications (all statuses) |
| `REVIEWER` | All applications with status `UNDER_REVIEW` |
| `ADMIN` | All applications (all statuses, all owners) |

**Access:** `SALES` | `REVIEWER` | `ADMIN`

**Response `200`:** Array of [MerchantApplication](#merchantapplication-object)

---

#### `GET /merchants/audit-logs?entityId=<uuid>`

Fetch the append-only audit trail for a specific application.

**Access:** `ADMIN`

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `entityId` | UUID | Yes | Application ID to fetch logs for |

**Response `200`:** Array of [AuditLog](#auditlog-object)

**Errors:** `403 Forbidden` — requires ADMIN role.

---

#### `GET /merchants/:id`

Fetch a single application by ID.

**Access:**
- `SALES` — own applications only
- `REVIEWER` / `ADMIN` — any application

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |

**Response `200`:** [MerchantApplication](#merchantapplication-object)

**Errors:** `404 Not Found` — application not found (or belongs to another SALES user).

---

#### `PATCH /merchants/:id`

Partially update application fields. All fields are optional.

**Access:** `SALES` (own applications only)

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |

**Request body** (all optional):
```json
{
  "businessName": "Acme Corp",
  "legalBusinessName": "Acme Corporation LLC",
  "businessType": "LLC",
  "country": "US",
  "mcc": "5411",
  "monthlyVolume": 50000,
  "ownerInfo": {
    "firstName": "Jane",
    "lastName": "Doe",
    "ssn": "123-45-6789",
    "dateOfBirth": "1985-03-15",
    "taxId": "12-3456789"
  },
  "bankAccountNumber": "000123456789",
  "routingNumber": "021000021"
}
```

> **Note:** `ssn`, `dateOfBirth`, `taxId`, `bankAccountNumber`, and `routingNumber` are stored AES-256-GCM encrypted. The API returns masked values (last 4 digits only).

**Response `200`:** [MerchantApplication](#merchantapplication-object)

---

#### `POST /merchants/:id/submit`

Submit an application for KYB (Know Your Business) risk review.

**Access:** `SALES` (own applications only)

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |

**Prerequisites** — application must be in `DRAFT` or `INFO_REQUESTED` status, and all required fields must be present:
- `businessName`, `legalBusinessName`, `businessType`, `country`, `mcc`, `monthlyVolume`

**What happens:**
1. Status transitions: `DRAFT` → `SUBMITTED` (or `INFO_REQUESTED` → `SUBMITTED`)
2. `riskStatus` set to `PENDING`
3. KYB job enqueued — an async worker calls the KYB provider and transitions the application to `UNDER_REVIEW` with the result (`riskStatus: APPROVED | FLAGGED | REJECTED`)

**Response `202 Accepted`:** [MerchantApplication](#merchantapplication-object) in `SUBMITTED` status

**Errors:**
- `422 Unprocessable Entity` — wrong status or missing required fields

---

#### `POST /merchants/:id/decision`

Record a reviewer decision on an application.

**Access:** `REVIEWER`

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |

**Request body:**
```json
{
  "decision": "APPROVED",   // "APPROVED" | "REJECTED" | "INFO_REQUESTED"
  "notes": "All documents verified."  // optional
}
```

**Decision outcomes:**

| Decision | New Status | Description |
|----------|-----------|-------------|
| `APPROVED` | `APPROVED` | Application accepted |
| `REJECTED` | `REJECTED` | Application denied |
| `INFO_REQUESTED` | `INFO_REQUESTED` | Sent back to merchant — they can update and re-submit |

Decision and notes are written to the audit log.

**Response `200`:** [MerchantApplication](#merchantapplication-object)

**Errors:**
- `403 Forbidden` — requires REVIEWER role
- `422 Unprocessable Entity` — application is not in `UNDER_REVIEW` status

---

#### `POST /merchants/:id/reviewer`

Assign a reviewer to an application.

**Access:** `ADMIN`

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |

**Request body:**
```json
{
  "reviewerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Assignment is recorded in the audit log.

**Response `200`:** [MerchantApplication](#merchantapplication-object) with `assignedReviewerId` set

**Errors:** `404 Not Found` — application not found.

---

#### `POST /merchants/:id/retry-risk`

Retry a failed KYB risk review.

**Access:** `ADMIN`

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |

**Prerequisites:** `riskStatus` must be `FAILED`.

**What happens:**
1. `riskStatus` reset to `PENDING`
2. KYB job re-enqueued with exponential backoff (4 attempts: 1s / 2s / 4s / 8s)
3. Retry recorded in the audit log

**Response `200`:** [MerchantApplication](#merchantapplication-object)

**Errors:**
- `403 Forbidden` — requires ADMIN role
- `422 Unprocessable Entity` — `riskStatus` is not `FAILED`

---

## Application State Machine

```
                     ┌─────────────────────────┐
                     │                         │
         submit()    ▼         KYB job         ▼
  DRAFT ──────────► SUBMITTED ──────────► UNDER_REVIEW
    ▲                                         │
    │  (re-submit after INFO_REQUESTED)        ├── approve()   ──► APPROVED
    │                                         ├── reject()    ──► REJECTED
    └──── INFO_REQUESTED ◄────────────────────┘
                              requestInfo()
```

**Risk status flow (async, internal):**

```
PENDING ──► APPROVED | FLAGGED | REJECTED
        └► FAILED  (on KYB provider error — retryable by ADMIN)
```

---

## Data Models

### MerchantApplication Object

```json
{
  "id": "uuid",
  "createdById": "uuid",
  "assignedReviewerId": "uuid | null",
  "status": "DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | INFO_REQUESTED",
  "riskStatus": "PENDING | APPROVED | FLAGGED | REJECTED | FAILED | null",
  "submissionCount": 1,
  "businessName": "Acme Corp",
  "legalBusinessName": "Acme Corporation LLC",
  "businessType": "LLC",
  "country": "US",
  "mcc": "5411",
  "monthlyVolume": 50000,
  "ownerInfo": {
    "firstName": "Jane",
    "lastName": "Doe",
    "ssn": "***-**-6789",
    "dateOfBirth": "***",
    "taxId": "***"
  },
  "bankAccountNumber": "****6789",
  "routingNumber": "****0021",
  "riskScore": 72.5,
  "riskReasons": ["High monthly volume"],
  "riskReference": "kyb-ref-abc123",
  "riskCheckedAt": "2026-11-22T07:35:56Z",
  "submittedAt": "2026-11-22T07:30:00Z",
  "decidedAt": "2026-11-22T08:00:00Z",
  "decisionNotes": "All documents verified.",
  "createdAt": "2026-11-22T07:00:00Z",
  "updatedAt": "2026-11-22T08:00:00Z",
  "version": 3
}
```

> Sensitive fields (`ssn`, `dateOfBirth`, `taxId`, `bankAccountNumber`, `routingNumber`) are stored encrypted and returned masked.

---

### AuditLog Object

```json
{
  "id": "uuid",
  "entityId": "uuid",
  "entityType": "MerchantApplication",
  "action": "APPROVED | REJECTED | INFO_REQUESTED | REVIEWER_ASSIGNED | RISK_RETRY",
  "actorId": "uuid",
  "metadata": {
    "notes": "All documents verified.",
    "reviewerId": "uuid"
  },
  "createdAt": "2026-11-22T08:00:00Z"
}
```

**Audit actions:**

| Action | Triggered by | Description |
|--------|-------------|-------------|
| `APPROVED` | REVIEWER | Decision: approved |
| `REJECTED` | REVIEWER | Decision: rejected |
| `INFO_REQUESTED` | REVIEWER | Decision: more info needed |
| `REVIEWER_ASSIGNED` | ADMIN | Reviewer assigned to application |
| `RISK_RETRY` | ADMIN | Failed KYB job manually retried |

---

## Typical Workflows

### SALES: Create and submit an application

```
1. POST /auth/register  { role: "SALES" }   → get accessToken
2. POST /merchants                           → create draft (id: <app-id>)
3. PATCH /merchants/<app-id>                 → fill required fields
4. POST /merchants/<app-id>/submit           → enqueue KYB check (async)
5. GET /merchants/<app-id>                   → poll until status = UNDER_REVIEW
```

### REVIEWER: Review and decide

```
1. POST /auth/login  { role: "REVIEWER" }   → get accessToken
2. GET /merchants                            → list UNDER_REVIEW applications
3. GET /merchants/<app-id>                   → inspect details and risk result
4. POST /merchants/<app-id>/decision         → { decision: "APPROVED", notes: "..." }
```

### ADMIN: Manage and audit

```
1. POST /auth/login  { role: "ADMIN" }      → get accessToken
2. GET /merchants                            → list all applications
3. POST /merchants/<app-id>/reviewer         → { reviewerId: "<reviewer-uuid>" }
4. POST /merchants/<app-id>/retry-risk       → (if riskStatus = FAILED)
5. GET /merchants/audit-logs?entityId=<app-id>  → full audit trail
```
