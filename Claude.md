# codevere

Node.js + Express application. This file documents the folder structure and
the SOLID principles the codebase is organized around, so new code stays
consistent with existing code.

## Folder structure

```
src/
├── config/              # environment and infrastructure wiring
│   ├── env.js
│   └── database.js
├── interfaces/          # JSDoc shape + runtime contract check used for DIP
│   └── user-repository.interface.js
├── models/               # Mongoose schemas, one file per entity
│   └── user.model.js
├── repositories/         # database access, implements the matching interface shape
│   └── user.repository.js
├── services/             # business logic, depends on a repository shape
│   └── user.service.js
├── controllers/          # HTTP request/response only
│   └── user.controller.js
├── validators/           # input validation middleware
│   └── user.validator.js
├── middlewares/          # cross-cutting Express middleware
│   ├── error-handler.middleware.js
│   └── not-found.middleware.js
├── routes/
│   ├── index.js          # mounts every feature's router under /api
│   └── user.routes.js    # composition root for the user feature + its routes
├── utils/
│   ├── logger.js
│   └── api-error.js
├── app.js                 # Express app assembly (middleware, routes)
└── server.js               # process entrypoint (DB connect + listen)

tests/
├── unit/
└── integration/
```

This is a **layer-based** layout: each technical concern (models,
repositories, services, controllers, validators, routes) has its own
top-level folder, and a feature's files share the same base name
(`user.model.js`, `user.repository.js`, `user.service.js`,
`user.controller.js`, `user.validator.js`, `user.routes.js`) so they're easy
to find across folders. Adding a feature means adding one same-named file to
each relevant folder, plus one line in `src/routes/index.js` to mount its
router.

## No classes

This codebase does not use `class`/`new`/`extends` anywhere in `src/`.
Every layer is a **plain function**, either a request handler/middleware or
a **factory function** that takes its dependencies as parameters and
returns a plain object of functions (closures hold the dependencies instead
of `this`):

```js
// user.repository.js
function createUserRepository() {
  return { create, findById, findByEmail, findAll, update, delete };
}

// user.service.js
function createUserService(userRepository) {
  return { createUser, getUserById, listUsers, updateUser, deleteUser };
}

// user.routes.js (composition root)
const userRepository = createUserRepository();
const userService = createUserService(userRepository);
const userController = createUserController(userService);
```

When writing new code, do not reach for `class` to group related
functions — write a `create<Thing>(deps)` factory function that returns a
plain object instead. `ApiError` follows the same rule: `src/utils/api-error.js`
exports plain functions (`badRequest`, `notFound`, `internal`) that build and
return a regular `Error` with extra properties, not an `Error` subclass.

## SOLID principles in this codebase

**Single Responsibility** — each folder, and each file in it, has exactly
one reason to change: `models/*.model.js` only defines schema,
`repositories/*.repository.js` only talks to the database,
`services/*.service.js` only holds business rules, `controllers/*.controller.js`
only translates HTTP ↔ service calls, `validators/*.validator.js` only
checks input shape. If you're adding logic and unsure where it goes, ask
which of those five responsibilities it is — don't let a controller reach
into the database or a service touch `req`/`res`.

**Open/Closed** — adding a new feature means adding a new same-named file
to `models/`, `repositories/`, `services/`, `controllers/`, and a `*.routes.js`,
plus one `router.use(...)` line in `src/routes/index.js`; it never means
editing an existing controller, service, or repository to special-case the
new feature.

**Liskov Substitution** — any plain object matching the `UserRepository`
shape documented in `user-repository.interface.js` (or an analogous
`<feature>-repository.interface.js`) must be fully swappable for another
implementation without the service noticing. The test repository fake in
`tests/unit/user.service.test.js` proves this: it has no database behind it
and `createUserService` works identically whether it's handed the Mongoose
repository or the fake.

**Interface Segregation** — repository shapes expose only the methods a
service actually calls (`create`, `findById`, `findByEmail`, `findAll`,
`update`, `delete`), listed as `REQUIRED_METHODS` in the interface file.
Don't bolt unrelated methods onto a shared shape; give a feature its own
narrow interface file instead.

**Dependency Inversion** — services never `require` a concrete repository
directly. `createUserService(userRepository)` receives it as a parameter,
and the concrete repository object is only created once, in
`src/routes/user.routes.js` (the composition root), via
`createUserRepository()`. This is what lets `createUserService` be
unit-tested with a plain object instead of a real MongoDB connection.

## Conventions

- Business errors are built with the `apiError` helper functions
  (`src/utils/api-error.js` — `badRequest`, `notFound`, `internal`) and
  caught centrally by `error-handler.middleware.js` — don't write
  `res.status(...).json(...)` for error cases inside a service or
  repository.
- Controllers always delegate to a service and call `next(err)` on
  failure; they contain no business logic themselves.
- Validation middleware runs before the controller and calls
  `next(apiError.badRequest(...))` on failure rather than throwing.
- Tests for a service pass a fake plain object matching the repository
  shape rather than hitting a real database (see
  `tests/unit/user.service.test.js`).

## Scripts

- `npm run dev` — start with nodemon
- `npm start` — start for production
- `npm test` — run the Jest suite
