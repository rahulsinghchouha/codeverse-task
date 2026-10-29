# codevere — multi-tenant backend

A Node.js/Express + MongoDB backend built around three layers of isolation:

- A **Superadmin** creates **Masters** (tenants).
- Each **Master** gets its own, fully isolated MongoDB **database** — not a
  shared collection with a filter, a physically separate database.
- Two end-user populations — **public signup users** and **master-created
  users** — can never log into each other's systems, even though every
  token in the system is signed with the same JWT secret.

See [Claude.md](Claude.md) for the folder layout and the SOLID conventions
the whole codebase follows (no `class` anywhere — every layer is a
`create<Thing>(deps)` factory function, dependencies passed in rather than
`require`'d directly, so every layer is swappable/testable in isolation).

## Tech stack

| Concern | Choice |
|---|---|
| Runtime / framework | Node.js, Express |
| Database (central + per-tenant) | MongoDB, via Mongoose |
| Cache | Redis (optional — see [Redis is optional](#redis-is-optional-by-design)) |
| Auth | JWT (`jsonwebtoken`), Bearer tokens, no sessions/cookies |
| Password hashing | `bcryptjs` |
| Tests | Jest, fake-repository unit tests (no real DB needed to run them) |

## Architecture

### Central database (`MONGO_URI`, e.g. `codevere_central`)

| Collection | Purpose |
|---|---|
| `SuperAdmin` | One bootstrap-seeded account. No public create-endpoint — seeded from `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` the first time the server boots against an empty collection. |
| `Master` | The **tenant registry**: `name`, `slug`, `dbName`, `email`, `passwordHash`, `createdBy` (ref → `SuperAdmin`). This is the bridge between "central" and "tenant" — every tenant-scoped request resolves its database from this row's `dbName`. |
| `PublicUser` | Signup/login users, unrelated to any tenant. |

### Tenant databases (one per master: `codevere_tenant_<slug>`)

Opened on demand via `mongoose.createConnection()` and cached in a pool
(`src/config/tenant-db.js`, keyed by `dbName`). Each tenant database holds:

| Collection | Purpose |
|---|---|
| `MasterUser` | Users created by that master (`POST /master/user`). Has a `masterId` field pointing back to the owning `Master` row — stored as a plain string, not a Mongoose `ref`, because `Master` lives on a *different connection* and Mongoose can't auto-populate across connections. |
| `Record` | The generic `/data` CRUD resource: `title`, free-form `payload`, `createdByType`/`createdById` (which master or master-user created it). |

Because each tenant's data lives on a **physically separate connection**,
there is no shared collection a query filter could leak across — a
master/master-user token can only ever resolve to its own tenant database,
by construction.

### Cross-login prevention

Every JWT carries a `type` claim: `superadmin | master | masterUser |
publicUser`. `createAuthMiddleware(allowedTypes)` (`src/middlewares/auth.middleware.js`)
verifies the signature **and** checks `type` against the route's allowed
list. A validly-signed `publicUser` token is still rejected on a
`masterUser`-only route with `403` — the four login systems are disjoint by
construction, not by convention, even though they share one `JWT_SECRET`.

`master`/`masterUser` tokens also carry `dbName`, so every tenant-scoped
controller resolves its database **from the token**, never from anything the
client sends in the URL or body — a tenant actor has no way to even ask for
a different tenant's data.

### Request flow (every endpoint)

```
routes/*.routes.js  (composition root: wires repo -> service -> controller, mounts on a path)
  -> validators/*.validator.js   (input shape only)
  -> middlewares/auth.middleware.js  (JWT verify + type check, for protected routes)
  -> controllers/*.controller.js (HTTP <-> service translation only)
  -> services/*.service.js       (business rules, password hashing, token issuing, tenant resolution)
  -> repositories/*.repository.js (persistence only — one Mongoose call per method)
  -> models/*.model.js            (schema; central models compile once, tenant models compile per connection)
```

## Data models reference

| Model | Lives in | Key fields | Compiled |
|---|---|---|---|
| `SuperAdmin` | central | `email`, `passwordHash` | once, default connection |
| `Master` | central | `name`, `slug`, `dbName`, `email`, `passwordHash`, `createdBy` (→ SuperAdmin) | once, default connection |
| `PublicUser` | central | `name`, `email`, `passwordHash` | once, default connection |
| `MasterUser` | per tenant | `name`, `email`, `passwordHash`, `masterId` | per tenant connection, via `getMasterUserModel(connection)` |
| `Record` | per tenant | `title`, `payload`, `createdByType`, `createdById` | per tenant connection, via `getRecordModel(connection)` |

(`src/models/user.model.js` is a separate, pre-existing single-tenant demo
feature mounted at `/api/users` — unrelated to the multi-tenant system
above, left in place.)

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Start MongoDB and Redis locally (or via Docker)
```
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

#### Redis is optional, by design
If Redis isn't reachable, the server still boots and just runs without the
`/data` list cache (`src/config/redis.js` catches connection failures,
caps retries, and every `getJson`/`setJson`/`del` call checks `client.isOpen`
before touching the socket). Caching is a performance optimization here,
never a correctness requirement.

### 3. Configure environment
Copy `.env.example` to `.env` and adjust if needed:
```
NODE_ENV=development
PORT=3000

MONGO_URI=mongodb://localhost:27017/codevere_central
MONGO_HOST=mongodb://localhost:27017

REDIS_URL=redis://localhost:6379

JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d

SUPERADMIN_EMAIL=admin@codevere.com
SUPERADMIN_PASSWORD=ChangeMe123!
```

### 4. Run it
```
npm run dev     # nodemon, auto-restarts on file changes
npm start       # production (no nodemon)
npm test        # jest unit tests — no real DB/Redis needed
```
On first boot, a superadmin account is auto-seeded from
`SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` if none exists yet
(`src/bootstrap/seed-superadmin.js`).

## API reference

| Method | Path | Auth required | Body |
|---|---|---|---|
| POST | `/superadmin/login` | — | `{ email, password }` |
| POST | `/superadmin/master` | `superadmin` token | `{ name, email, password }` |
| GET | `/superadmin/masters` | `superadmin` token | — |
| POST | `/master/login` | — | `{ email, password }` |
| POST | `/master/user` | `master` token | `{ name, email, password }` |
| GET | `/master/users` | `master` token | — |
| POST | `/master/user/login` | — | `{ masterSlug, email, password }` |
| GET | `/master/user/profile` | `masterUser` token | — |
| POST | `/auth/signup` | — | `{ name, email, password }` |
| POST | `/auth/login` | — | `{ email, password }` |
| GET | `/auth/profile` | `publicUser` token | — |
| POST | `/data` | `master` **or** `masterUser` token | `{ title, payload? }` |
| GET | `/data` | `master` **or** `masterUser` token | — (cached per tenant, 60s TTL) |
| GET | `/data/:id` | `master` **or** `masterUser` token | — |
| PUT | `/data/:id` | `master` **or** `masterUser` token | any subset of `{ title, payload }` |
| DELETE | `/data/:id` | `master` **or** `masterUser` token | — |

`Authorization: Bearer <token>` is required on every row marked "token" above.
Validation rules (min password length 6, required fields, email shape) live
in `src/validators/*.validator.js` and reject with `400` before the
controller ever runs.

## End-to-end walkthrough

### bash / curl

```bash
# 1. Superadmin logs in
curl -s -X POST localhost:3000/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@codevere.com","password":"ChangeMe123!"}'
# => { "token": "<SUPERADMIN_TOKEN>" }

# 2. Superadmin creates a master (this provisions its isolated tenant DB)
curl -s -X POST localhost:3000/superadmin/master \
  -H "Authorization: Bearer <SUPERADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"Acme Co","email":"owner@acme.com","password":"secret123"}'
# => { "name": "Acme Co", "slug": "acme-co", "dbName": "codevere_tenant_acme-co", "createdBy": "...", ... }

curl -s localhost:3000/superadmin/masters -H "Authorization: Bearer <SUPERADMIN_TOKEN>"

# 3. Master logs in
curl -s -X POST localhost:3000/master/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@acme.com","password":"secret123"}'
# => { "token": "<MASTER_TOKEN>" }

# 4. Master creates a user inside its own tenant DB
curl -s -X POST localhost:3000/master/user \
  -H "Authorization: Bearer <MASTER_TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@acme.com","password":"secret123"}'

curl -s localhost:3000/master/users -H "Authorization: Bearer <MASTER_TOKEN>"

# 5. Master-user logs in — needs the master's slug to find the right tenant DB
curl -s -X POST localhost:3000/master/user/login \
  -H "Content-Type: application/json" \
  -d '{"masterSlug":"acme-co","email":"bob@acme.com","password":"secret123"}'
# => { "token": "<MASTER_USER_TOKEN>" }

curl -s localhost:3000/master/user/profile -H "Authorization: Bearer <MASTER_USER_TOKEN>"

# 6. Tenant-scoped generic data CRUD (master OR master-user token both work)
curl -s -X POST localhost:3000/data \
  -H "Authorization: Bearer <MASTER_USER_TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"First record","payload":{"foo":"bar"}}'

curl -s localhost:3000/data -H "Authorization: Bearer <MASTER_USER_TOKEN>"   # cached in Redis per tenant
curl -s localhost:3000/data/<id> -H "Authorization: Bearer <MASTER_USER_TOKEN>"
curl -s -X PUT localhost:3000/data/<id> -H "Authorization: Bearer <MASTER_USER_TOKEN>" -d '{"title":"Updated"}'
curl -s -X DELETE localhost:3000/data/<id> -H "Authorization: Bearer <MASTER_USER_TOKEN>"

# 7. Public signup/login, fully separate system
curl -s -X POST localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Carol","email":"carol@example.com","password":"secret123"}'
curl -s -X POST localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carol@example.com","password":"secret123"}'
curl -s localhost:3000/auth/profile -H "Authorization: Bearer <PUBLIC_USER_TOKEN>"

# Negative test: a publicUser token is rejected on a master-only route
curl -s -i localhost:3000/master/users -H "Authorization: Bearer <PUBLIC_USER_TOKEN>"
# => 403 Token is not authorized for this resource
```

### Windows PowerShell

`curl` is aliased to `Invoke-WebRequest` in PowerShell, which doesn't accept
`-H`/`-d`. Either call the real binary as `curl.exe` with escaped double
quotes, or (recommended) use `Invoke-RestMethod`, which parses JSON
responses into objects automatically so tokens chain cleanly between calls:

```powershell
# 1. Superadmin logs in
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/superadmin/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@codevere.com","password":"ChangeMe123!"}'
$token = $login.token

# 2. Superadmin creates a master
$master = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/superadmin/master" `
  -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" `
  -Body '{"name":"Acme Co","email":"owner@acme.com","password":"secret123"}'
$master

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/superadmin/masters" `
  -Headers @{ Authorization = "Bearer $token" }

# 3. Master logs in
$masterLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/master/login" `
  -ContentType "application/json" -Body '{"email":"owner@acme.com","password":"secret123"}'
$masterToken = $masterLogin.token

# 4. Master creates a user
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/master/user" `
  -Headers @{ Authorization = "Bearer $masterToken" } -ContentType "application/json" `
  -Body '{"name":"Bob","email":"bob@acme.com","password":"secret123"}'

# 5. Master-user logs in — masterSlug comes from step 2's response ($master.slug)
$muLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/master/user/login" `
  -ContentType "application/json" `
  -Body (@{ masterSlug = $master.slug; email = "bob@acme.com"; password = "secret123" } | ConvertTo-Json)
$muToken = $muLogin.token

# 6. /data CRUD
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/data" `
  -Headers @{ Authorization = "Bearer $muToken" } -ContentType "application/json" `
  -Body '{"title":"First record","payload":{"foo":"bar"}}'

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/data" -Headers @{ Authorization = "Bearer $muToken" }
```

## Testing

```
npm test
```
21 Jest unit tests across `tests/unit/`, each using a plain fake object in
place of the real repository/Mongoose/Redis client (same pattern as the
original `user.service.test.js`) — no real database or Redis connection
needed to run the suite. Coverage focuses on the parts that matter most for
this brief: tenant resolution (`master.service.test.js`,
`master-user.service.test.js`), cache invalidation (`record.service.test.js`),
and — most importantly — cross-login prevention (`auth.middleware.test.js`,
which proves a correctly-signed token of the wrong `type` is rejected).

## Troubleshooting

**"Invalid or expired token" right after a successful login** — almost
always a truncated/partial copy of the token, not an actual expiry. Terminal
table formatting (e.g. printing a PowerShell object with a long string
column) visually truncates with `...`; copying that truncated text produces
a broken JWT. Use `$token | Set-Clipboard` (PowerShell) to copy the full
value, or better, chain requests in the same script so the token variable is
used directly and never hand-copied.

**PowerShell: `-H`/`-d` not recognized, or "parameter X not found"** — `curl`
is aliased to `Invoke-WebRequest` in PowerShell, which uses different flags.
Either call `curl.exe` explicitly (the real binary, bypassing the alias) with
double-quoted, escaped JSON (`-d "{\"email\":\"...\"}"`), or use
`Invoke-RestMethod`/`Invoke-WebRequest` with `-Headers`/`-Body` as shown above.

**Server seems to hang on startup with repeated "Redis client error" logs** —
fixed in `src/config/redis.js`: `reconnectStrategy` is capped at a few
retries and `connectRedis()` races the connection attempt against a 2s
timeout, so boot is never blocked even if Redis is completely unreachable.

**`403 Token is not authorized for this resource`** — this is expected
behavior, not a bug, whenever a token's `type` claim doesn't match what the
route requires (e.g. a `publicUser` token on a `/master/*` route). It's the
cross-login prevention working as designed.

## Module layout

```
src/
├── config/        env, central DB connection, redis client, tenant connection pool
├── models/        super-admin, master, public-user (central, compiled once) +
│                  master-user, record (schema factories compiled per tenant connection)
├── interfaces/    repository shape contracts (DIP)
├── repositories/  persistence only — one Mongoose call per method, no business rules
├── services/      business rules, password hashing, token issuance, tenant resolution
├── controllers/   HTTP <-> service translation only
├── validators/    input-shape checks (shared helpers in common.validator.js)
├── middlewares/   auth.middleware.js (type-claim check), error-handler, not-found
├── routes/        one composition root per URL prefix (wires repo -> service -> controller)
└── bootstrap/     one-time superadmin seed on server start

tests/
└── unit/          fake-repository service tests, no real DB/Redis required
```
