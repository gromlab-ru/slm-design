# Frontend architecture cases

This document is the contract for behaviors intentionally built into the demo backend. The APIs are deterministic: reset state before a demo with `POST /api/v1/testing/reset`.

## Project-size mapping

| Frontend type        | Recommended API surface                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| Landing or small SPA | Public Simple products and categories                                                |
| Medium application   | Full Simple API with JWT, user profile and orders                                    |
| Large application    | Complex API with cookie session, tenant context, RBAC, jobs, files and realtime chat |

## Controlled network scenarios

Send `X-Demo-Scenario` with any HTTP request. The response repeats the selected value in `X-Demo-Scenario`.

| Value           | Behavior                                      | Frontend concern                        |
| --------------- | --------------------------------------------- | --------------------------------------- |
| `normal`        | Normal deterministic response                 | Happy path                              |
| `slow`          | Delays for `MOCK_SLOW_DELAY_MS`               | Loading states, cancellation, skeletons |
| `timeout`       | Delays for `MOCK_TIMEOUT_DELAY_MS`            | Client timeout and abort handling       |
| `server-error`  | Returns `500`                                 | Error boundaries and retry UX           |
| `rate-limited`  | Returns `429` and `Retry-After: 3`            | Backoff and retry policy                |
| `empty`         | Changes a list response to a valid empty page | Empty states                            |
| `expired-auth`  | Protected endpoint returns `401`              | Refresh or re-login flow                |
| `forbidden`     | Protected endpoint returns `403`              | Permission UI                           |
| `conflict`      | Mutation returns `409`                        | Conflict UX and rollback                |
| `large-dataset` | Expands a list response to 250 items          | Rendering and virtualization            |

Scenario effects are request-local. They do not introduce random failures or make automated tests flaky.

## Authentication cases

### Simple JWT

- Access and refresh tokens are returned by `POST /api/v1/auth/login`.
- Access tokens are sent as `Authorization: Bearer <token>`.
- Refresh tokens rotate. Reusing an already rotated refresh token returns `401 REFRESH_TOKEN_REUSED`.
- Logout revokes the supplied refresh token and is idempotent.
- Access and refresh lifetimes are configurable through environment variables.
- Protected requests support forced `401` and `403` scenarios.

### Complex cookie session

- Login sets HttpOnly `demo_session` and readable `demo_csrf` cookies.
- Browser requests must use `credentials: 'include'`.
- Mutations additionally send the `demo_csrf` value in `X-CSRF-Token`.
- Session refresh rotates both the session ID and CSRF token.
- `POST /api/v1/testing/session/expire` expires the current session without changing frontend state.
- Roles can change while the session remains active.
- Socket.IO authenticates using the same `demo_session` cookie.

## Data fetching cases

| Case                 | Endpoint example                                       |
| -------------------- | ------------------------------------------------------ |
| Offset pagination    | Simple products, customers, audit events               |
| Cursor pagination    | Complex products, orders, notifications, chat messages |
| Search and filtering | Products and customers                                 |
| Sorting              | Simple products                                        |
| Nested resources     | Organization members and conversation messages         |
| Nullable values      | Avatar, category parent, publish date, file/job result |
| Decimal strings      | Complex prices, discounts and totals                   |
| Polymorphic union    | Order, inventory and system notification payloads      |
| Tree data            | Complex categories with parent/child IDs               |
| Large seed           | `POST /api/v1/testing/seed/large`                      |

## Cache case

Product details return a weak `ETag`. Repeat the request with `If-None-Match`; unchanged data returns `304 Not Modified`. Product updates increment `version` and produce a new ETag.

## Mutation and concurrency cases

- Simple and Complex product updates require the last-read `version`.
- Inventory adjustments require `version` and reject negative stock.
- Stale writes return `409` with a stable error code.
- Complex order creation requires `Idempotency-Key`.
- Repeating the same order request and key returns the original order instead of creating a duplicate.
- Invalid nested forms return field-oriented validation details.
- Order cancellation validates allowed state transitions.
- Mutations are added to the Complex audit log.

## RBAC and multitenancy cases

- Complex domain routes require `X-Organization-Id`.
- Missing tenant context returns `400 ORGANIZATION_REQUIRED`.
- A tenant unavailable to the current user returns `403 ORGANIZATION_FORBIDDEN`.
- Admin and manager can mutate catalog/inventory and start exports.
- Support can create and cancel orders but cannot change products.
- Viewer is read-only.
- Test users and memberships are documented in the main README.

## Background work

`POST /api/v1/exports/orders` returns `202` and a job. Poll `GET /api/v1/jobs/:id` to observe:

```text
pending -> processing -> completed
```

Progress and `resultUrl` change over time. Downloading the result before completion returns `409 JOB_NOT_COMPLETED`.

## Files

- Multipart upload accepts a `file` field up to 5 MiB.
- Metadata and bytes remain in memory until reset or restart.
- Download returns binary content and `Content-Disposition`.
- The API supports missing-file validation, loading progress and cancellation testing.

## Realtime chat

- REST supplies conversation and cursor-paginated message history.
- Socket.IO supplies joins, typing state and messages.
- `clientMessageId` deduplicates retried sends.
- Invalid or expired cookie sessions are disconnected.
- REST-created messages are also broadcast to the Socket.IO room.
- The complete event contract is in [WEBSOCKET.md](./WEBSOCKET.md).

## Observability and errors

Every HTTP response exposes `X-Request-Id`, `X-Response-Time` and `X-Demo-Scenario`. A frontend can supply its own `X-Request-Id`. Error bodies include that request ID, a stable machine-readable `code`, human-readable `message`, field `details`, timestamp and path.

## Reset behavior

| Endpoint                              | Effect                                |
| ------------------------------------- | ------------------------------------- |
| `POST /api/v1/testing/reset`          | Restores the small deterministic seed |
| `POST /api/v1/testing/seed/small`     | Loads normal fixtures                 |
| `POST /api/v1/testing/seed/large`     | Loads 250 products and customers      |
| `POST /api/v1/testing/users/:id/role` | Changes access without a new login    |
| `POST /api/v1/testing/session/expire` | Expires the current Complex session   |

All mutations are process-local and disappear after restart.
