# Demo backend

An isolated NestJS package containing two independently launched HTTP applications and two OpenAPI contracts. Data is deterministic and stored in memory; no database or external service is required.

## Applications

| Application |   Port | Authentication                 | Swagger UI                   | OpenAPI JSON                         |
| ----------- | -----: | ------------------------------ | ---------------------------- | ------------------------------------ |
| Simple      | `3001` | JWT access/refresh             | `http://localhost:3001/docs` | `http://localhost:3001/openapi.json` |
| Complex     | `3002` | HttpOnly cookie session + CSRF | `http://localhost:3002/docs` | `http://localhost:3002/openapi.json` |

Committed specifications are generated at `openapi/simple.json` and `openapi/complex.json`.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Start

```bash
npm install
npm run start:dev
```

Run only one application:

```bash
npm run dev:simple
npm run dev:complex
```

Production-style build and start:

```bash
npm run build
npm run start:simple
npm run start:complex
```

## Demo users

All passwords are `demo1234`.

### Simple API

| Email                 | Role     |
| --------------------- | -------- |
| `admin@demo.local`    | admin    |
| `customer@demo.local` | customer |

### Complex API

| Email                  | Role    | Organizations            |
| ---------------------- | ------- | ------------------------ |
| `admin@complex.demo`   | admin   | `org-acme`, `org-globex` |
| `manager@complex.demo` | manager | `org-acme`               |
| `support@complex.demo` | support | `org-acme`               |
| `viewer@complex.demo`  | viewer  | `org-acme`               |

## Simple authentication example

```bash
curl -s http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.local","password":"demo1234"}'
```

Use `data.tokens.accessToken` as a Bearer token.

## Complex authentication example

```bash
curl -i -c /tmp/demo-cookies.txt http://localhost:3002/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@complex.demo","password":"demo1234"}'
```

The response body contains `data.csrfToken`. Protected reads require cookies and tenant context:

```bash
curl -b /tmp/demo-cookies.txt http://localhost:3002/api/v1/products \
  -H 'X-Organization-Id: org-acme'
```

Mutations also require `X-CSRF-Token` with the value returned by login.

## OpenAPI

Generate and validate both specifications:

```bash
npm run openapi:generate
npm run openapi:validate
```

The validator checks OpenAPI validity, unique operation IDs, expected security schemes and route isolation between the two applications.

## Verification

```bash
npm run typecheck
npm run build
npm run test:e2e
npm run openapi:generate
npm run openapi:validate
```

## Built-in frontend cases

The intentionally supported cases are documented in [docs/CASES.md](./docs/CASES.md). They include controlled latency and errors, JWT refresh races, cookie expiration, CSRF, RBAC, tenant switching, offset and cursor pagination, ETag, optimistic locking, idempotency, background jobs, multipart files, polymorphic DTOs, audit events and realtime reconnection/deduplication.

The Socket.IO event contract is documented separately in [docs/WEBSOCKET.md](./docs/WEBSOCKET.md).

## Important limitation

This is a frontend architecture fixture, not a production identity or commerce service. Passwords, sessions, files and mutations live only in process memory. Restart or `POST /api/v1/testing/reset` restores deterministic data.
