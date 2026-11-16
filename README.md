<p align="center">
  <img src="https://averoajs.netlify.app/img/g19580.png" alt="AveroaJS logo">
</p>

<h1 align="center">AveroaJS</h1>

<p align="center">
  A Laravel-style application structure for Express 5: controllers, models, migrations, generators and secure defaults.
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/node-%5E20.19%20%7C%7C%20%5E22.13%20%7C%7C%20%3E%3D24-339933?logo=node.js&logoColor=white" alt="Node.js ^20.19 || ^22.13 || >=24">
  <img src="https://img.shields.io/badge/express-5-000000?logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/module-ESM-f7df1e" alt="ESM only">
</p>

---

AveroaJS is an application boilerplate for REST APIs and server-rendered sites built on **Express 5**, **Knex 3**,
**Objection 3** and **Edge 5**. This repository is the application you clone and build on. The framework code lives
in three npm packages ([`@averoa/core`](#ecosystem), [`@averoa/routes`](#ecosystem) and
[`@averoa/utilities`](#ecosystem)) that the application installs as ordinary dependencies.

> [!NOTE]
> Version 2 is **ESM only** and requires **Node.js 20.19 or newer** on 20.x, 22.13 or newer on 22.x, or 24 and newer. If you are
> coming from 1.x, read [Upgrading from 1.x](#upgrading-from-1x) first; for the changes in 2.2.0, see
> [2.2.0](#220), [2.2.0: authentication](#220-authentication) and
> [2.2.0: jobs and scheduling](#220-jobs-and-scheduling).

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Routing](#routing)
- [Controllers, middleware and providers](#controllers-middleware-and-providers)
- [Models](#models)
- [CRUD and query filters](#crud-and-query-filters)
- [Validation](#validation)
- [API documentation](#api-documentation)
- [Authentication](#authentication)
- [Views](#views)
- [Mail, queues and jobs](#mail-queues-and-jobs)
- [Jobs and scheduling](#jobs-and-scheduling)
- [File uploads](#file-uploads)
- [Database: migrations and seeds](#database-migrations-and-seeds)
- [CLI generators](#cli-generators)
- [Utilities](#utilities)
- [Security](#security)
- [Observability](#observability)
- [Docker and deployment](#docker-and-deployment)
- [Testing and linting](#testing-and-linting)
- [Upgrading from 1.x](#upgrading-from-1x)
- [Ecosystem](#ecosystem)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

AveroaJS gives an Express application the folder layout and conventions of a Laravel project. Routes point at
`'Controller@method'` strings, models describe their own columns once for migrations, seeders and validation, and
`router.crud()` together with the `Crud` helper turns a model into a validated, filterable, paginated REST resource.

It is intended for developers who want Express's simplicity and ecosystem but prefer a predictable project
structure over assembling middleware by hand for every new service.

**Design principles**

- **Convention over configuration.** Controllers, middleware, models and providers are found by name in fixed
  folders under `app/`. Routing, views, sessions and error handling are wired by `@averoa/core` at startup.
- **Laravel-style layout.** `app/Controllers`, `app/Models`, `app/Middleware`, `app/Providers`, `routes/`,
  `resources/views`, `database/migrations` and `database/seeds` mean what they mean in Laravel.
- **Secure by default.** Helmet with a Content Security Policy, CSRF protection, `httpOnly` session cookies, a CORS
  policy that fails closed outside development, request size limits, sandboxed upload serving and scrypt password
  hashing are on without any configuration.
- **Fail early.** A missing `TOKEN_SECRET`, a missing `SESSION_SECRET` outside development and test, or a route that points at a
  controller method that does not exist stops the application at startup rather than at request time.

## Features

| Area | What you get |
| --- | --- |
| Structure | Laravel-style folders, `#models` / `#helpers` / ... subpath imports instead of `../../` paths |
| Routing | `'Controller@method'` handlers, prefixes, groups, route and global middleware, multipart `*Form` routes, `crud()` model hooks |
| Models | Objection models whose `static column` map drives migrations, faker seeders and request validation; soft delete and audit columns; hidden columns |
| REST resources | `node averoa make:crud <tables>` generates model, migration, seeder, controller and routes |
| Query language | Thirteen filter operators, pagination, sorting, grouping, `$select`, `$relations`, all validated against the model's columns |
| Authentication | JWT access tokens with rotating refresh tokens (reuse detection, logout, logout everywhere), registration, email verification, password reset, rate limits, a passport-local session strategy, scrypt password hashing |
| Authorization | `Gate` abilities and model policies from `@averoa/utilities`, the `can()` route middleware and an `EnsureEmailVerified` middleware |
| Rate limiting | A global per-IP limit on `/api`, a strict limiter on the login route, `rateLimit()` for your own routes; counters in memory or shared through Redis |
| Sessions | MemoryStore for development, `SESSION_STORE=redis` for production and several instances |
| Views | Edge 5 templates with dot-notation names, global variables and a CSRF token in every view |
| Mail and queues | Nodemailer with Edge templates, RabbitMQ publishing, and a mail worker with retries and reconnects |
| Jobs and scheduling | `Job` classes with delays, retries, backoff, timeouts and a failed-jobs queue; a job worker; a cron scheduler in `app/Console/Kernel.js` |
| Database | MySQL (`mysql2`, default), PostgreSQL (`pg`) and SQLite (`better-sqlite3`, `sqlite3`) through Knex |
| Operations | Request IDs, structured (JSON) logs with redaction, stdout or file logging, `/health` and `/ready` probes, graceful shutdown on `SIGTERM` / `SIGINT` |
| Testing | `node --test` integration tests that boot the real app on in-memory SQLite |

## Requirements

| Requirement | Version / notes |
| --- | --- |
| Node.js | `^20.19.0 \|\| ^22.13.0 \|\| >=24` (`engines` in `package.json`, the range declared by ESLint 10 and `@faker-js/faker` 10): 20.19 or later, 22.13 or later on the 22.x line, or 24 and newer. `npm test` runs on all of them. |
| npm | 10 or later (declared by `@faker-js/faker` 10, which the seeders use) |
| Database | One of the clients handled by `config/database.js`: `mysql2` (default, installed), `pg`, `better-sqlite3` (installed as a devDependency) or `sqlite3`. Install `pg` or `sqlite3` yourself when you use them. |
| RabbitMQ | Optional. Only needed for `Queue()`, `Mail...queue()`, jobs, the workers and the scheduler. |
| SMTP server | Optional. Only needed to send mail. |
| `@aws-sdk/client-s3` | Optional. Only needed for `UPLOAD_DRIVER=s3`; an `optionalDependency`, installed unless you pass `--omit=optional`, see [Storing uploads in S3](#storing-uploads-in-s3). |
| Docker | Optional. Docker Engine with Compose v2 for the `Dockerfile` and `compose.yaml`, see [Docker and deployment](#docker-and-deployment). |

## Quick start

The steps below use SQLite, so no database server is needed.

```bash
git clone https://github.com/budiherma1/averoajs.git
cd averoajs
npm install
cp .env.example .env
```

The application refuses to start without `TOKEN_SECRET`. Generate it and a session secret:

```bash
echo "TOKEN_SECRET=$(npm run -s generate:token)" >> .env
echo "SESSION_SECRET=$(npm run -s generate:token)" >> .env
```

Point the database at a SQLite file. A relative path is resolved against the application root, so the app and the
knex CLI open the same file:

```bash
echo "DB_CLIENT=better-sqlite3" >> .env
echo "DB_NAME=database/dev.sqlite" >> .env
```

The appended lines win over the empty values earlier in `.env`. Now create the tables, load the demo data and start
the development server (nodemon):

```bash
npm run migrate:up
npm run seed:run
npm run dev
```

Open <http://localhost:8888> for the welcome page, or call the API:

```bash
curl http://localhost:8888/api
# {"name":"Averoa","version":"2.2.2"}

curl -X POST http://localhost:8888/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@averoa.test","password":"password"}'
# {"status":true,"data":{"token":"eyJ...","type":"Bearer","expires_in":900,"refresh_token":"...","refresh_expires_in":2592000}}
```

**Using Docker instead.** `compose.yaml` runs the app with MySQL, RabbitMQ, Redis, MinIO and Mailpit; see
[Docker and deployment](#docker-and-deployment).

**Using MySQL or PostgreSQL instead.** Leave `DB_CLIENT=mysql2` (or set `DB_CLIENT=pg` after `npm install pg`), fill in
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` and `DB_NAME`, and create the database before running the migrations.
Knex does not create the database itself.

### Routes in the boilerplate

| Method | Path | Handler | Notes |
| --- | --- | --- | --- |
| `GET` | `/` | `SampleController@sampleMethodView` | renders `welcome.edge` |
| `GET` | `/users` | `SampleController@sampleMethodModel` | renders `users.edge` with every user's first name (no emails or addresses) |
| `GET` | `/teacher` | `TeacherController@index` | renders `teacher.edge` |
| `GET` | `/api` | `SampleController@sampleMethod` | `{ name, version }` |
| `POST` | `/api/users` | `SampleController@sampleMethodModelPost` | admins only (`AuthMiddleware`, `EnsureEmailVerified`, `can('admin')`); validates the body with `Users.validation()`; on success returns `id`, names and email of every user (it does not insert) |
| `POST` | `/api/auth/login` | `AuthController@login` | validates the body with `validate()` (`app/Validators/AuthValidator.js`), issues an access token and a refresh token; behind `LoginRateLimitMiddleware` (`429` after 5 failed attempts per IP and email in 15 minutes) |
| `GET` | `/api/auth/me` | `AuthController@me` | behind `AuthMiddleware` |
| `POST` | `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all` | `AuthController` | see [Authentication](#authentication) |
| `POST` | `/api/auth/forgot-password`, `/api/auth/reset-password` | `PasswordResetController` | see [Password reset](#password-reset) |
| `GET` `POST` | `/api/auth/verify-email`; `POST /api/auth/resend-verification` | `EmailVerificationController` | see [Email verification](#email-verification) |
| `GET` `POST` `PUT` `DELETE` | `/api/teachers`, `/api/teachers/:id` | `TeacherController` | `router.crud('Teacher', 'teachers', ...)`; `GET` is public; `POST` needs a JWT and a verified email; `PUT` / `DELETE` need a JWT and `TeacherPolicy` (owner or admin) |
| `GET` | `/api/v2/teachers` | `TeacherController@findAll` | nested `prefix()` example |
| `GET` | `/api/v2/test`, `/api/v2/test/otherprefix` | `SampleController@sampleMethodView` | nested `prefix()` example |
| `GET` | `/api/openapi.json`, `/api/docs` | `@averoa/core` | OpenAPI document and Swagger UI; only when `OPENAPI_ENABLED` (default: development/test). See [API documentation](#api-documentation) |

These routes are samples. `/api/auth/me` and the Teacher writes require a JWT, and `POST /api/users` an admin's (see
[Authentication](#authentication)); the rest are public. Remove or protect them before you deploy (see
[Production checklist](#production-checklist)).

## Project structure

```text
averoajs/
├── app/
│   ├── Console/              Kernel.js: the task schedule (npm run schedule:run)
│   ├── Controllers/          request handlers, referenced as 'NameController@method'
│   ├── Helpers/              helpers, exported from index.js          -> '#helpers'
│   ├── Jobs/                 background jobs (Job classes)             -> '#jobs'
│   ├── Middleware/           route middleware, referenced by file name
│   ├── Models/               Objection models with column definitions  -> '#models'
│   ├── Providers/            App, Middleware, Upload and View providers -> '#providers'
│   ├── Repositories/         query classes                             -> '#repositories'
│   ├── Strategies/           passport strategies                       -> '#strategies'
│   └── Validators/           validate() middleware for non-crud routes -> '#app/Validators/...'
├── config/
│   ├── database.js           Knex configuration from DB_* variables
│   ├── fetch.js              axios defaults for the Fetch utility from FETCH_* variables
│   ├── mail.js               nodemailer transport from MAIL_* variables
│   └── queue.js              AMQP URL from RABBITMQ_SERVER
├── database/
│   ├── migrations/           Knex migrations (ESM)
│   ├── seeds/                Knex seeders, run in file-name order
│   └── stubs/                ESM templates for migrate:make and seed:make
├── public/                   static files served at /
├── resources/
│   ├── assets/               placeholder (not wired yet)
│   ├── lang/                 placeholder (not wired yet)
│   └── views/                Edge templates
├── routes/
│   ├── api.js                mounted at /api
│   ├── web.js                mounted at /
│   └── v2/                   route modules included by api.js
├── scripts/
│   ├── link-local.mjs        install local checkouts of the framework packages
│   └── run-tests.mjs         npm test: runs tests/*.test.js on every platform
├── storages/
│   ├── logs/                 averoa.log, access.log, error.log
│   └── upload/               uploaded files (UPLOAD_DRIVER=local), served at /upload
├── tests/                    node:test suites
├── workers/
│   ├── jobs.js               job worker: npm run worker:jobs
│   ├── mail.js               mail worker: npm run worker:mail
│   ├── retry-failed-jobs.js  re-queue failed jobs: npm run queue:retry
│   └── scheduler.js          scheduler: npm run schedule:run
│   └── mail.js               mail worker entry point: npm run worker:mail
├── .dockerignore             files kept out of the Docker build context (.env, node_modules, ...)
├── .env.example              environment template
├── averoa.js                 CLI entry point: node averoa <command>
├── compose.yaml              local development stack (app, MySQL, RabbitMQ, Redis, MinIO, Mailpit)
├── Dockerfile                production image (and a development target for compose.yaml)
├── eslint.config.js          ESLint 10 flat config
└── server.js                 application entry point: awaits start() from @averoa/core
```

## Architecture

### Bootstrap sequence

`server.js` calls `start()` from `@averoa/core`. `start()` builds the application in this order and then listens:

1. Load `.env` from the application root. Variables already present in the environment take precedence.
2. Import `@averoa/utilities`, which creates the shared Knex instance (`config/database.js`), the logger and the
   Edge instance.
3. Import `app/Providers/index.js` (optional).
4. Create the Express app, disable `x-powered-by`, apply `TRUST_PROXY`, assign the [request id](#request-ids) and
   answer the [health probes](#health-checks) (`/health`, `/ready`).
5. `AppProvider.beginning(app)`.
6. Request logging (morgan) to `storages/logs/access.log` and `storages/logs/error.log`, plus the console outside
   `production` and `test` (see [Logging](#logging) for `LOG_CHANNEL` and JSON lines).
7. Helmet, using the options returned by `AppProvider.helmet(defaults)`.
8. CORS.
9. The global rate limiter on `/api` (`RATE_LIMIT_*`, `AppProvider.rateLimit(defaults)`). When a Redis store is
   selected, Redis is connected first; outside `development` / `test` startup fails if it is unreachable.
10. `express.json()` and `express.urlencoded()` limited to `BODY_LIMIT`, then `cookie-parser`.
11. `express-session` with the store from `SESSION_STORE` (merged with `AppProvider.session()`),
    `passport.initialize()` and `passport.session()`.
12. `config()` of every export of `app/Strategies/index.js`.
13. Bind Objection to the shared Knex instance.
14. Register the Edge view engine and `ViewProvider.global()`.
15. Load `routes/api.js` and `routes/web.js` and resolve every controller, middleware and model they reference.
16. CSRF protection (unless `CSRF_ENABLED=false`).
17. Mount the API router at `/api` and the web router at `/`.
18. Serve `public/` at `/` and `storages/upload` at `/upload`.
19. `AppProvider.end(app)`.
20. 404 handler and error handler.

`start()` then listens on `options.port`, `APP_PORT` or `3000` (all interfaces), calls `AppProvider.server(server)`
and installs the graceful-shutdown handlers. `createApp()` runs steps 1 to 20 without listening; the test suite uses it.

| Function | Returns | Options |
| --- | --- | --- |
| `start(options?)` | `Promise<{ app, server, health, close }>` | `port`, `host` (listen hostname), `handleSignals` (default `true`) |
| `createApp(options?)` | `Promise<{ app, health }>` | none needed by applications |

### Request lifecycle

```mermaid
flowchart TD
  req(["HTTP request"]) --> rid["request id"]
  rid -->|"GET /health, /ready"| probe["health probes"]
  rid --> early["AppProvider.beginning() middleware"]
  early --> base["morgan → helmet → CORS → rate limit (/api) → body parsers → cookies → session → passport"]
  base --> csrf{"CSRF check"}
  csrf -->|"path under /api"| api["API router"]
  csrf -->|"other paths"| web["web router"]
  subgraph chain ["Route handler chain (@averoa/routes)"]
    direction LR
    g1["MiddlewareProvider.beginning()"] --> rm["scope + route middleware"] --> g2["MiddlewareProvider.end()"] --> mp["multipart parsing (*Form routes)"] --> hooks["crud() model hooks"] --> ctrl["controller"]
  end
  api --> chain
  web --> chain
  csrf -.->|"no route matched"| stat["public/ → /upload → AppProvider.end() → 404"]
  ctrl -.->|"error thrown or promise rejected"| err["error handler"]
  stat -.-> err
```

A client over the `/api` rate limit is answered with `429` before the body is parsed.
The error handler answers with JSON (`{ status: false, message, requestId }`) when the path is under `/api`, the
request is an XHR, or the client prefers JSON, and with a small HTML page (showing the request id) otherwise. Error `status` / `statusCode` values between 400
and 599 are kept; anything else becomes 500. 5xx errors are logged. When `NODE_ENV` is `development` or `test` the
response also contains the stack trace; with any other `NODE_ENV`, including unset, there is no stack and 5xx messages
are replaced by `Internal Server Error`.

### How application code is found

The framework packages never import your code with relative paths. They resolve the **application root** and import
files from there:

1. `AVEROA_ROOT`, when set (absolute, or relative to the working directory).
2. Otherwise the nearest directory, walking up from the working directory, that contains a `package.json` and is not
   inside `node_modules`.

Within the application, `package.json` defines [subpath imports](https://nodejs.org/api/packages.html#subpath-imports)
so your own modules never need `../../` paths:

| Import | Resolves to |
| --- | --- |
| `#models` | `app/Models/index.js` |
| `#providers` | `app/Providers/index.js` |
| `#repositories` | `app/Repositories/index.js` |
| `#helpers` | `app/Helpers/index.js` |
| `#jobs` | `app/Jobs/index.js` |
| `#strategies` | `app/Strategies/index.js` |
| `#app/*` | `app/*`, with the file extension, e.g. `#app/Strategies/JwtStrategy.js` |

```js
import { Users } from '#models';
import { PasswordHelper } from '#helpers';
```

Generated migrations and seeders import models through `#models`, so keep the `imports` block in `package.json`.

## Configuration

All settings come from environment variables, loaded from `.env` in the application root. Start from
`.env.example`. Defaults below are what the code uses when a variable is unset.

### Application

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | unset | `development` and `test` enable the permissive local behaviour (non-`secure` session cookie, credentialed CORS without a whitelist). Any other value, including unset, gets the production-safe behaviour: `SESSION_SECRET` is required and stack traces and 5xx details are hidden. `production` additionally enables the view cache and the CSP's `upgrade-insecure-requests`, and stops logging to the console. `.env.example` sets `development`. |
| `APP_PORT` | `3000` | Port to listen on. `.env.example` sets `8888`. |
| `APP_HOST` | `http://localhost` | Only used in the startup message. The server listens on all interfaces. |
| `TOKEN_SECRET` | none, **required** | HS256 secret for JWTs. Startup fails without it. |
| `JWT_ACCESS_TTL` | `TOKEN_EXPIRES_IN`, else `15m` | Access token lifetime: seconds (`900`) or a number with a unit `s`, `m`, `h`, `d`, `w`. Anything else stops the app at startup. |
| `TOKEN_EXPIRES_IN` | unset | Older name of `JWT_ACCESS_TTL`, read when that one is unset. Same format (jsonwebtoken strings such as `2 days` are no longer accepted). |
| `JWT_REFRESH_TTL` | `30d` | Refresh token lifetime; each refresh rotates the token and restarts it. |
| `PASSWORD_RESET_TTL` | `60m` | Lifetime of a password reset link. |
| `PASSWORD_RESET_THROTTLE` | `60s` | Minimum time between two reset links for one account (requests in between are answered the same and send nothing). |
| `EMAIL_VERIFICATION_TTL` | `24h` | Lifetime of an email verification link. |
| `EMAIL_VERIFICATION_THROTTLE` | `60s` | Minimum time between two verification emails (`resend-verification` answers `429` before). |
| `APP_URL` | `APP_HOST:APP_PORT` | Public URL of the application. |
| `FRONTEND_URL` | `APP_URL` | Base of the links in the emails: `<FRONTEND_URL>/verify-email?token=...` and `<FRONTEND_URL>/reset-password?token=...`. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | Window of the auth rate limits (15 minutes). |
| `AUTH_RATE_LIMIT_MAX` | `10` | Requests per window, client IP and endpoint, to `register` and `forgot-password`. |
| `AUTH_RATE_LIMIT_FAILED_MAX` | `20` | Failed requests per window, client IP and endpoint, to `refresh`, `reset-password` and `verify-email`. |
| `SESSION_SECRET` | random per boot | Session cookie secret. **Required unless `NODE_ENV` is `development` or `test`.** A comma-separated list rotates secrets: the first signs, all verify. |
| `CSRF_ENABLED` | `true` | `false`, `0`, `no` or `off` disables CSRF protection. |
| `CORS_WHITELIST` | empty | Comma-separated allowed origins. See [CORS](#cors). Empty in `.env.example`. |
| `BODY_LIMIT` | `1mb` | Maximum JSON and urlencoded body size. Larger bodies get `413`. |
| `LOG_LEVEL` | `info` | winston level: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`. |
| `TRUST_PROXY` | unset | Express `trust proxy`: `true`, `false`, a hop count, or an Express trust string such as `loopback`. `.env.example` sets `false`. |
| `SHUTDOWN_TIMEOUT` | `10000` | Milliseconds allowed for graceful shutdown before the process is forced to exit (counted after `SHUTDOWN_DELAY`). |
| `OPENAPI_ENABLED` | on in `development` / `test` | Serves the generated OpenAPI document at `GET /api/openapi.json` and Swagger UI at `GET /api/docs`. Empty in `.env.example`, so it follows `NODE_ENV`; set `true` to publish it in another environment. |
| `OPENAPI_UI` | `true` | `false` keeps `/api/openapi.json` but not the `/api/docs` page. |
| `AVEROA_ROOT` | auto-detected | Application root. Only needed when the process starts outside the project folder. |

### Sessions, Redis and rate limiting

| Variable | Default | Description |
| --- | --- | --- |
| `SESSION_STORE` | `memory` | `memory` (express-session's MemoryStore: one process only, lost on restart, warns outside `development` / `test`) or `redis` (shared by every instance; needs `npm install redis connect-redis`). |
| `SESSION_REDIS_PREFIX` | `sess:` | Redis key prefix for sessions. Use a distinct prefix per application when several share a Redis. |
| `SESSION_TTL` | `86400` | Seconds a session lives in Redis when the cookie has no `maxAge`. |
| `REDIS_URL` | unset | `redis://[user:password@]host:port[/db]` (`rediss://` for TLS). Required when a Redis store is selected. One connection is shared by sessions and rate limits. |
| `REDIS_CONNECT_TIMEOUT` | `5000` | Milliseconds to wait for Redis at startup. Outside `development` / `test` the application refuses to start when Redis is not reachable in time; in `development` / `test` it logs a warning, starts and keeps reconnecting. |
| `RATE_LIMIT_ENABLED` | `true` | `false`, `0`, `no` or `off` turns the global `/api` limiter off (the login limiter stays). |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window of the global `/api` limiter. |
| `RATE_LIMIT_MAX` | `100` | Requests per client IP and window on `/api`. |
| `RATE_LIMIT_STORE` | `redis` when `SESSION_STORE=redis`, else `memory` | Where every limiter keeps its counters: `memory` (each process counts on its own) or `redis` (shared; needs `npm install redis rate-limit-redis`). |
| `RATE_LIMIT_REDIS_PREFIX` | `rl:` | Redis key prefix for rate-limit counters. |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Failed logins per IP and email per window before `POST /api/auth/login` answers `429`. |
| `LOGIN_RATE_LIMIT_IP_MAX` | `50` | Failed logins per IP (any email) per window. |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | `900000` | Window of both login limiters (15 minutes). |

Invalid values (an unknown store, `RATE_LIMIT_MAX=abc`, `0`) stop the application at startup instead of silently
changing a limit.
| `AVEROA_ROOT` | auto-detected | Application root. Only needed when the process starts outside the project folder. |

### Logging, request IDs and health checks

See [Observability](#observability) for the details.

| Variable | Default | Description |
| --- | --- | --- |
| `LOG_CHANNEL` | unset | `stdout`, `file` or `both`. Unset: files in `storages/logs`, plus the console unless `NODE_ENV=production` (`test` also hides the request log). `stdout` writes nothing to disk. |
| `LOG_FORMAT` | `pretty` for `development` / `test`, `json` otherwise | Console format of the application log: `json` or `pretty`. Files are always JSON lines. |
| `ACCESS_LOG_FORMAT` | `combined` in files; `json` or `dev` on stdout | HTTP access log format: `combined`, `json` or `dev` (stdout only). |
| `LOG_REDACT` | empty | Extra keys to redact in logged objects, comma separated. |
| `TRUST_REQUEST_ID` | `false` | `true` reuses a valid incoming `X-Request-Id`; set it only when your proxy sets or overwrites that header. |
| `REQUEST_ID_HEADER` | `X-Request-Id` | Request id header name. |
| `HEALTH_PATH` | `/health` | Liveness probe path; `false` or `off` disables it. |
| `READY_PATH` | `/ready` | Readiness probe path; `false` or `off` disables it. |
| `READY_TIMEOUT` | `2000` | Per-check timeout of the readiness probe, in milliseconds. |
| `READY_CHECKS` | `database` | Built-in readiness checks: `database`, `queue` (RabbitMQ), comma separated; `none` for none. |
| `SHUTDOWN_DELAY` | `0` | Milliseconds `/ready` answers `503` on `SIGTERM` / `SIGINT` before the server closes. |

### Uploads

| Variable | Default | Description |
| --- | --- | --- |
| `UPLOAD_MAX_FILE_SIZE` | `UploadImageMiddleware`: 2 MB; `*Form` routes: 10 MB | Maximum file size in bytes for both. `.env.example` sets `2097152` (2 MB). |
| `UPLOAD_MAX_FILES` | `10` | Maximum number of files per `*Form` request. |
| `UPLOAD_INLINE_EXTENSIONS` | `jpg,jpeg,png,gif,webp,avif,bmp,ico` | Extensions served inline from `/upload` (and stored without `Content-Disposition: attachment` in S3); everything else is sent as a download. |
| `UPLOAD_DRIVER` | `local` | Where `UploadProvider` stores files: `local` (`storages/upload`) or `s3`. Any other value is an error. |
| `S3_BUCKET` | none | Bucket name. Required when `UPLOAD_DRIVER=s3`. |
| `S3_REGION` | `us-east-1` | Bucket region. |
| `S3_ENDPOINT` | unset (AWS) | Endpoint of an S3-compatible service, e.g. `http://localhost:9000` (MinIO), `https://<account>.r2.cloudflarestorage.com`. |
| `S3_FORCE_PATH_STYLE` | `false` | `true` for `endpoint/bucket/key` URLs instead of `bucket.endpoint/key`; MinIO needs it. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | unset | Static credentials. Set both or neither; when unset the AWS SDK's default credential chain is used (IAM role, `AWS_*` variables, shared config). |
| `S3_PUBLIC_URL` | derived | Base URL that `UploadProvider.url()` puts in front of a key, e.g. your CDN. Defaults to the bucket's endpoint URL. |

### Database

| Variable | Default | Description |
| --- | --- | --- |
| `DB_CLIENT` | `mysql2` | `mysql2`, `pg`, `better-sqlite3` or `sqlite3`. `mysql` is mapped to `mysql2`. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | unset | Connection settings. For SQLite clients `DB_NAME` is the database file (default `:memory:`). `.env.example` sets `127.0.0.1:3306`. |
| `DB_TIMEZONE` | `Z` | `mysql2` only: `Z`/`UTC`, an offset such as `+07:00`, or `local`. Sets the driver `timezone` and the session `time_zone` together, so timestamps written by MySQL and by the app use the same zone. `local` keeps the old behaviour (Node.js zone for the driver, server default for the session). |
| `AVEROA_CONFIG_WAIT_MS` | `2000` | How long `@averoa/utilities` waits for `config/database.js` at import time before continuing to load it in the background. |

### Mail and queues

| Variable | Default | Description |
| --- | --- | --- |
| `MAIL_HOST`, `MAIL_PORT` | unset | SMTP server. `.env.example` sets `127.0.0.1:2525`. |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | unset | SMTP credentials. Leave `MAIL_USERNAME` empty for no authentication. |
| `MAIL_ENCRYPTION` | unset | `ssl` uses implicit TLS (port 465 does too). `tls` or empty lets nodemailer negotiate STARTTLS. |
| `MAIL_SECURE` | unset | `true` forces implicit TLS, `false` turns it off; either overrides `MAIL_ENCRYPTION` and the port. |
| `MAIL_QUEUE` | `mail` | Default queue for `Mail...queue()` and the mail worker. |
| `RABBITMQ_SERVER` | unset | AMQP URL. `Queue` throws when it is not configured. `.env.example` sets `amqp://localhost`. |

SMTP is the only mail transport.

### Jobs and scheduling

| Variable | Default | Description |
| --- | --- | --- |
| `JOBS_QUEUE` | `jobs` | Queue of jobs that set no `static queue` (`config/queue.js` `jobsQueue`). Failed jobs are kept in `<queue>.failed`. |
| `JOBS_WORKER_QUEUES` | unset | `npm run worker:jobs`: comma-separated queues to consume. Unset: the queues of the jobs in `app/Jobs`. |
| `JOBS_CONCURRENCY` | `1` | `npm run worker:jobs`: jobs run at the same time per queue. |
| `SCHEDULE_TIMEZONE` | unset | Default IANA time zone of the schedule. Unset: the process time zone. |

### Fetch

| Variable | Default | Description |
| --- | --- | --- |
| `FETCH_BASE_URL` | unset | Base URL prepended to relative `Fetch` URLs. |
| `FETCH_TIMEOUT` | `10000` | Request timeout in milliseconds; `0` disables it. |

### Configuration files

| File | Used by | Contents |
| --- | --- | --- |
| `config/database.js` | `DB`, Objection, the knex CLI | Default export `(process) => knexConfig`. Maps `DB_*` to a Knex config; resolves a relative SQLite `DB_NAME` against the application root; enables `dateStrings` for `mysql2`; points `migrate:make` / `seed:make` at the ESM templates in `database/stubs`. |
| `config/mail.js` | `Mail`, the mail worker | nodemailer SMTP transport options from `MAIL_*`. Add a `queue` key to change the default mail queue. |
| `config/queue.js` | `Queue` | `{ amqp }` from `RABBITMQ_SERVER`. A `heartbeat` key (seconds, default 5) is also accepted. |
| `config/fetch.js` | `Fetch` | axios defaults: `baseURL` from `FETCH_BASE_URL`, `timeout` from `FETCH_TIMEOUT` (default 10 s), no body size limits. Commented examples show `maxContentLength`, `auth` and `proxy`. |

Each file may export an object or a function that receives `process`. Config files must not import the root
`@averoa/utilities` package (see [Troubleshooting](#troubleshooting)); import helpers from
`@averoa/utilities/paths` instead.

## Routing

`routes/api.js` is mounted at `/api` and `routes/web.js` at `/`. Each file creates a router with `Router()` from
`@averoa/routes`, declares routes, and default-exports it. Core calls `init()` at startup, which resolves every handler
and middleware and fails with an error naming the route if a file or method is missing.

```js
import Router from '@averoa/routes';

const router = Router();

router.get('/', 'SampleController@sampleMethodView');
router.get('/health', (req, res) => res.json({ ok: true }));

router.middleware(['AuthMiddleware'], () => {
  router.get('/profile', 'ProfileController@show');
});

router.group({ prefix: 'admin', middleware: ['AuthMiddleware'] }, () => {
  router.crud('Users', 'users', () => {
    router.get('/', 'UsersController@findAll');
    router.post('/', 'UsersController@create');
  });
});

export default router;
```

### Router API

| Method | Description |
| --- | --- |
| `get` `post` `put` `patch` `delete` `(uri, handler, middleware?)` | Register one verb. `handler` is `'Controller@method'` or a function. `middleware` is an array. |
| `postForm` `putForm` `patchForm` `(uri, handler, middleware?)` | Same, with multipart parsing: files in `req.files`, fields in `req.body`. |
| `match(verbs, uri, handler, middleware?)` | Several verbs: any of `get`, `post`, `put`, `patch`, `delete`, `head`, `options`, `all`. |
| `any(uri, handler, middleware?)` | `get`, `post`, `put`, `delete` and `patch`. |
| `all(uri, handler, middleware?)` | Express `router.all()`. Never receives `crud()` model hooks. |
| `middleware(names, callback)` | Apply middleware to every route declared in `callback`. |
| `prefix(prefix, callback)` | Prefix every route declared in `callback`. |
| `group({ prefix, middleware }, callback)` | Both of the above. |
| `crud(model, prefix?, callback)` | Prefix plus the model hooks described in [CRUD and query filters](#crud-and-query-filters). `set()` is an alias. |
| `config({ controller, middleware, model, upload })` | Change the folders (`{ path }`), the middleware method name (`middleware.method`, default `handle`) or the multer limits (`upload.limits`) for this router. |

Rules worth knowing:

- **Handlers.** `'TeacherController@findAll'` loads the default export of `app/Controllers/TeacherController.js`. The
  export may be an instance, a class (instantiated once), a class with a static method of that name, or a plain object.
- **Middleware.** A string names a file in `app/Middleware` whose export has a `handle(req, res, next)` method.
  Functions, objects with `handle`, and classes are accepted as well.
- **Order.** Scope middleware runs outer to inner, then the route's own middleware.
- **Synchronous scopes.** `group()`, `prefix()`, `middleware()` and `crud()` callbacks must be synchronous. An `async`
  callback throws, because routes declared after an `await` would lose the scope.
- **Express 5 paths.** Patterns follow path-to-regexp 8: wildcards must be named (`/*splat`). Trailing slashes are
  normalised, so `crud('Teacher', 'teachers', () => router.get('/', ...))` registers `/teachers`.
- **Errors.** Synchronous throws and rejected promises in controllers, middleware and hooks reach the error handler.
  `req.query` is a getter in Express 5: copy it (`const q = { ...req.query }`) instead of modifying it.

### Handler order

Every route runs this chain:

```text
MiddlewareProvider.beginning()  →  scope middleware  →  route middleware  →  MiddlewareProvider.end()
  →  multipart parsing (*Form routes only)  →  crud() model hooks  →  controller
```

Multipart bodies are parsed **after** all middleware, so authentication rejects a request before any upload is
buffered. As a consequence, `req.files` and multipart fields are not available in middleware on `*Form` routes; read
them in a model hook or the controller.

## Controllers, middleware and providers

### Controllers

A controller is a class whose methods receive `(req, res)`. Export an instance (the boilerplate's convention) or the
class itself.

```js
class TeacherController {
  async index(req, res) {
    res.render('teacher', { name: 'Teacher Page', title: 'Averoa' });
  }
}

export default new TeacherController();
```

Create one with `node averoa make:controller NameController`.

### Middleware

```js
class AdminMiddleware {
  handle(req, res, next) {
    if (req.user?.is_admin) return next();
    return res.status(403).json({ status: false, message: 'Forbidden' });
  }
}

export default new AdminMiddleware();
```

| File | Purpose |
| --- | --- |
| `AuthMiddleware.js` | Requires a valid JWT (`JwtStrategy`); sets `req.user` or answers `401`. |
| `LoginMiddleware.js` | Runs `LocalStrategy` for a session login form. Not mounted on any route. |
| `LoginRateLimitMiddleware.js` | Brute-force protection for `POST /api/auth/login`: `429` after repeated failed logins. See [Rate limiting](#rate-limiting). |
| `UploadImageMiddleware.js` | Accepts one image in the `image` field, for custom controllers and `upload` columns. See [File uploads](#file-uploads). |
| `ErrorMiddleware.js` | Sample that always forwards a `401` error ("Please login to view this page."). |

### Providers

Providers in `app/Providers` let you hook into the framework. Every method is optional. `AppProvider`,
`ViewProvider` and `MiddlewareProvider` methods may be `async`.

**`AppProvider`**

| Method | Called | Purpose |
| --- | --- | --- |
| `beginning(app)` | before any framework middleware | Register middleware that must run first. It runs before helmet, CORS, sessions and CSRF. |
| `helmet(defaults)` | while building | Return helmet options (for example a relaxed CSP), or `false` to disable helmet. Returning nothing keeps the defaults. |
| `session()` | while building | Return extra `express-session` options (cookie options are merged). The store comes from `SESSION_STORE`; a `store` returned here wins over it. |
| `rateLimit(defaults)` | while building, unless `RATE_LIMIT_ENABLED=false` | Return the global limiter's options (`{ path: '/api', name: 'global', windowMs, limit }` plus any `rateLimit()` option; `path: '/'` covers every route), or `false` to disable it. |
| `uploads()` | while building | Return `{ inlineExtensions: [...] }` to change the inline allowlist for `/upload`, or `false` to stop serving `/upload`. Not present in the boilerplate's file; add it when needed. |
| `health(checks)` | while building | Return the readiness checks for `/ready` (the built-in `{ database }` plus your own, e.g. Redis), or `false` to disable `/health` and `/ready`. See [Health checks](#health-checks). |
| `end(app)` | after routes and static files, before the 404 handler | Register fallbacks, for example a custom 404 page. |
| `server(server)` | after the HTTP server starts listening | Attach to the `http.Server` (for example a WebSocket server). Not called by `createApp()`. |
| `shutdown()` | on `SIGTERM` / `SIGINT`, after the HTTP server has closed | Release your own resources before the database and queue connections close. |
| `openapi(doc)` | on the first `GET /api/openapi.json` | Change the generated OpenAPI document (title, servers, extra schemas) and return it. The boilerplate sets the title. |

```js
// app/Providers/AppProvider.js (excerpt): allow scripts from a CDN
helmet(defaults) {
  defaults.contentSecurityPolicy.directives['script-src'].push('https://cdn.jsdelivr.net');
  return defaults;
}
```

**`MiddlewareProvider`** returns arrays of global middleware from `beginning()` and `end()`. They run on every route of
both routers, in the positions shown in [Handler order](#handler-order). Entries are resolved like route middleware
(names, functions or objects with `handle`). Global middleware does not run for requests that match no route.

**`ViewProvider`** has one method, `global()`, whose returned object is registered once as Edge globals. The
boilerplate registers `testVariable`, `sayHello()` and `menu`.

**`UploadProvider`** stores uploaded files. See [File uploads](#file-uploads).

### Repositories, helpers, jobs and strategies

| Folder | Import | Shipped files |
| --- | --- | --- |
| `app/Repositories` | `#repositories` | `UserRepository` (`findActiveById`, `findActiveByEmail`, `findByCredentials`), `ExampleRepository` (sample) |
| `app/Helpers` | `#helpers` | `PasswordHelper` (`hash`, `hashSync`, `verify`, `isHash`), `ExampleHelper` (sample) |
| `app/Jobs` | `#jobs` | `SendWelcomeEmailJob`, `PruneSoftDeletedJob` (background jobs, see [Jobs and scheduling](#jobs-and-scheduling)), `EmailSubscriberJob` (mail worker), `GenerateAppTokenJob` (`npm run generate:token`) |
| `app/Strategies` | `#strategies` | `JwtStrategy`, `LocalStrategy` |

Each folder has an `index.js` that re-exports its modules. The generators add new files to it.

Core calls `config()` on **every** export of `app/Strategies/index.js` at startup, so a strategy registers itself with
passport once. A strategy also exposes `authenticate(req, res, next)` for middleware to call.

## Models

Models extend `Model` from `@averoa/utilities`, which extends Objection's `Model`. A model's `static column` map is the
single description of each column, used by the migration, the seeder and request validation.

```js
import { Model } from '@averoa/utilities';
import Rooms from './Rooms.js';

class Teacher extends Model {
  static tableName = 'teacher';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      flag: { required: false },
    },
    teacher_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.person.firstName(),
      validation: [{ run: (v) => v.validator.isLength(String(v.value).trim(), { min: 1, max: 50 }), msg: 'must be 1-50 characters' }],
      flag: { required: true },
    },
    type: {
      migration: (m) => m.table.smallint(m.column).nullable(),
      seed: (f) => f.number.int({ min: 1, max: 3 }),
      validation: [{ run: (v) => v.validator.isInt(String(v.value), { min: 1, max: 3 }), msg: 'must be an integer between 1 and 3' }],
      flag: { required: true },
    },
  };

  static relationMappings = () => ({
    rooms: {
      relation: Model.HasManyRelation,
      modelClass: Rooms,
      join: { from: 'teacher.id', to: 'rooms.teacher_id' },
    },
  });
}

export default Teacher;
```

### Column definition

| Key | Receives | Purpose |
| --- | --- | --- |
| `migration` | `{ table, knex, column }` | Define the column in `Model.migrationUp()`. Columns without it are not created by that migration. |
| `seed` | the faker instance (`@faker-js/faker` 10) | Value for `Model.seeder()`. |
| `validation` | array of `{ run, msg }` | `run({ validator, value })` returns `true` when valid. `validator` is the [validator](https://www.npmjs.com/package/validator) package; `value` is a string (`JSON.stringify` for `json` columns). |
| `flag` | object | See below. |

| Flag | Default | Effect |
| --- | --- | --- |
| `required` | `true` | Anything but `false` makes the column required: it must be non-empty (`''`, `null` and `undefined` are empty) on create, and may not be emptied on update. |
| `unique` | `false` | Rejects a value that already exists in a row that is not soft-deleted (the row being updated is excluded). |
| `upload` | `false` | The column holds an uploaded file on `*Form` crud routes, or on crud routes with `UploadImageMiddleware`. See [File uploads](#file-uploads). |
| `search` | `true` | Include the column in `Model.search(query, term)`. |
| `writable` | `false` | Allow a column listed in `static hidden` to be written from requests (for example a password that `$beforeInsert` hashes). |
| `fillable` | `false` | Allow the primary key to be written from requests. |
| `json` | `false` | Accept objects and arrays. Other columns reject them with `must be a scalar value`. |

### Static properties

| Property | Default | Effect |
| --- | --- | --- |
| `tableName` | none | Objection table name. |
| `timestamp` | on | Anything but `false` adds `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at` and `deleted_by` in `migrationUp()` and turns on soft delete. `updated_at` uses `ON UPDATE CURRENT_TIMESTAMP` on MySQL. |
| `hidden` | `[]` | Removed from every JSON serialisation; refused by `$select`, filters and `orderBy`; not writable from requests unless the column is flagged `writable`. |
| `allowGraph` | the model's own relations, depth 1 | Relation expression clients may load with `$relations`, e.g. `'[rooms.teacher]'`. `false` disables `$relations`. |
| `allowWithTrashed` | `false` | Allow `?$withTrashed=1` to include soft-deleted rows. |
| `relationMappings` | none | Standard Objection relations. |

### Static methods

| Method | Description |
| --- | --- |
| `migrationUp(knex)` / `migrationDown(knex)` | Create / drop the table from `column` (used by the generated migrations). |
| `seeder(count, knex)` | **Deletes every row of the table**, then inserts `count` rows of `seed` values. |
| `seederCustom(count, callback, knex)` | Same, with values returned by `await callback()` overriding the `seed` values. |
| `validation(data, type = 'create')` | Validate a plain object. Returns `{ status: true }` or `{ status: false, data: { column, message } }`. Does not check `unique`. |
| `search(query, term)` | Add `orWhere(column, 'like', '%term%')` for every searchable, non-hidden column. |
| `filterSearch(req, config)` | Run the [query filter language](#query-filters) against this model. |
| `writableColumns()` | Columns a request may write. |
| `checkParamId`, `validationRouter`, `mapRequest` | The `crud()` route hooks. |

Soft-deleted rows are excluded from listings, `findOne`, `checkParamId`, `update`, `delete`, unique checks and fetched
relations. Use the regular Objection API (`Users.query()`) for queries of your own; it does not add the soft-delete
filter for you.

## CRUD and query filters

### `crud()` model hooks

Inside `router.crud('Teacher', 'teachers', ...)`, routes receive hooks from `app/Models/Teacher.js` before the
controller:

| Verb | Hooks | Failure responses |
| --- | --- | --- |
| `POST`, `PUT`, `PATCH` | `checkParamId` → `validationRouter` → `mapRequest` | `404` for an unknown or soft-deleted `:id`; `422` when validation fails |
| `GET`, `DELETE` | `checkParamId` → `mapRequest` | `404` for an unknown or soft-deleted `:id` |

```json
{ "status": false, "message": "ID 9999 doesn't exist" }
{ "status": false, "data": { "column": "teacher_name", "message": "required" } }
{ "status": false, "data": { "column": "type", "message": ["must be an integer between 1 and 3"] } }
```

`message` is the string `required` (or `must be a scalar value`) for presence and type checks, and an array of the
failing rule messages otherwise. Only the first failing column is reported.

`validationRouter` replaces `req.body` with the writable columns only: the primary key (unless `fillable`), audit
columns, hidden columns (unless `writable`) and unknown keys are dropped. The original body stays in `req.bodyRaw`,
and the result is copied to `req.dataReq`, which the `Crud` helper writes.

The model is loaded from `app/Models/<Name>.js` by the router, while the `Crud` helper looks it up in
`app/Models/index.js`. A model used with both must exist in both places; `make:model` and `make:crud` take care of it.

### The `Crud` helper

```js
import { Crud } from '@averoa/utilities';

class TeacherController {
  async findAll(req, res) {
    const result = await Crud.findAll('Teacher', req);
    res.status(result.statusCode ?? 200).json(result);
  }
}
```

| Method | Result |
| --- | --- |
| `Crud.create(model, req, option?, trx?)` | `{ status: true, data }`. Sets `created_by` / `updated_by` from `req.user.id` when present. `option.insert` adds values. |
| `Crud.findAll(model, req, option?)` | Paginated result (below). `option`: `{ limit, page, maxLimit }`. |
| `Crud.findOne(model, req, option?)` | `{ status: true, data }`, or a `404` failure for a missing or soft-deleted id. Supports `$select` and `$relations`. |
| `Crud.update(model, req, option?, trx?)` | `{ status: true }`, or a `404` failure when no live row matched. Never overwrites `created_at` / `created_by`; sets `updated_at` and `updated_by`. `option.update` adds values. |
| `Crud.delete(model, req, option?, trx?)` | `{ status: true }`, or a `404` failure when no live row matched. Soft delete (sets `deleted_at` / `deleted_by`) unless `timestamp` is `false`, then a hard delete. |

`model` is a name exported from `app/Models/index.js` or a model class. Every method returns
`{ status: false, message, statusCode }` instead of throwing. `statusCode` is `400` for an invalid filter, `$select` or
`$relations`, `404` for an unknown id, `422` for a model validation error and `500` for a database error. Database
errors are logged and reported as `Database error`, so SQL and bound values never reach the client. Success results
have no `statusCode`.

The `Crud.*` methods do not send responses. The sample `TeacherController` and the controllers generated by
`make:crud` respond with `result.statusCode` on failure (`400` if a failure has none); on success the sample answers
`201` on create and `200` otherwise, the generated controllers always `200`.

### Query filters

Every `findAll` endpoint, for example `GET /api/teachers`, reads filters, pagination and sorting from the query string.
All values are passed to the database as bound parameters, and column names are checked against the model's columns.

| Parameter | SQL | Example |
| --- | --- | --- |
| `col=v` | `= v` | `/api/teachers?type=2` |
| `col:eq=v` | `=` | `/api/teachers?user_id:eq=4` |
| `col:neq=v` | `!=` | `/api/teachers?type:neq=3` |
| `col:lt=v` / `col:lte=v` | `<` / `<=` | `/api/teachers?saldo:lt=500000` |
| `col:gt=v` / `col:gte=v` | `>` / `>=` | `/api/teachers?saldo:gte=500000` |
| `col:like=v` | `like` (`like binary`, case-sensitive, on MySQL) | `/api/teachers?teacher_name:like=%25Ada%25` |
| `col:ilike=v` | `ilike` on PostgreSQL, `like` elsewhere | `/api/teachers?teacher_name:ilike=%25ada%25` |
| `col:in=a,b` | `in (a, b)` | `/api/teachers?id:in=1,2,3` |
| `col:btwn=a,b` | `between a and b` (exactly two values) | `/api/teachers?saldo:btwn=200000,500000` |
| `col:isNull=` | `is null` (value ignored) | `/api/teachers?address:isNull=1` |
| `col:notNull=` | `is not null` (value ignored) | `/api/teachers?address:notNull=1` |
| `a\|b:search=words` | each space-separated word as `%word%` (`ilike` on PostgreSQL, `like` elsewhere), in any listed column | `/api/teachers?teacher_name\|address:search=ada%20london` |
| `a\|b:op=v` | the same operator on several columns, joined with `OR` | `/api/teachers?saldo\|type:lt=44` |

`%` must be encoded as `%25` in a URL: `teacher_name:like=%25Ada%25` means `like '%Ada%'`.

**Reserved parameters**

| Parameter | Effect | Example |
| --- | --- | --- |
| `limit` | Page size, default `10`. `0` means all rows up to `maxLimit`. Values above `maxLimit` (default `1000`) are capped. | `?limit=20` |
| `page` | Page number, starting at `1`. | `?limit=20&page=2` |
| `orderBy` / `orderByDesc` | Sort by one of the model's own columns. `orderByDesc` wins when both are given. | `?orderByDesc=created_at` |
| `groupBy` | `group by` one of the model's own columns; `item_total` counts distinct values. | `?groupBy=type&$select=type` |
| `$select` | Return only these columns. Hidden and unknown columns are refused. | `?$select=id,teacher_name` |
| `$relations` | Load relations permitted by `allowGraph`. | `?$relations=[rooms]` |
| `$relations-type=join` | Join the relations instead of fetching them separately, so filters can use `relation.column`. Pagination still counts root rows. | `?$relations=[rooms]&$relations-type=join&rooms.room_name=Room%20A` |
| `$withTrashed` | `1`, `true` or `yes` includes soft-deleted rows. Refused unless `allowWithTrashed` is `true`. | `?$withTrashed=1` |
| `$datatable` | Return the DataTables shape `{ draw, recordsTotal, recordsFiltered, data }`; `draw` echoes `$draw`. | `?$datatable=1&$draw=3` |

**Response**

```json
{
  "status": true,
  "metadata": {
    "item_total": 10,
    "per_page": 2,
    "page_total": 5,
    "current_page": 1,
    "has_next_page": true,
    "has_prev_page": false
  },
  "data": [{ "id": 1, "teacher_name": "Ada" }]
}
```

`per_page` is the smaller of the page size and `item_total`, and `page_total` is at least `1`.

**Strict and ignored keys.** A key with an operator (`col:op`) on an unknown or hidden column, an unknown operator on a
known column, a non-scalar value, an invalid `limit` / `page`, or a disallowed `$select` / `$relations` /
`$withTrashed` returns `{ status: false, message }`, for example `column foo doesn't exist`. Keys that are not filters
at all are **ignored**: a bare `foo=bar` on an unknown column, a bare hidden column such as `password=x`, `_` (cache
buster), `utm:source=x` and similar. A bare `relation.column=v` without `$relations-type=join` is ignored as well.

For plain Knex queries, `FilterSearch.knex(builder, req, { column: [...] })` from `@averoa/utilities` applies the same
language with an explicit column whitelist.

## Validation

`crud()` routes are validated by their model (see [`crud()` model hooks](#crud-model-hooks)). Every other route can
use `validate()` from `@averoa/utilities`, a middleware for `body`, `query`, `params` and `headers`. Rules are written
like Model column rules; the boilerplate keeps them in `app/Validators`:

```js
// app/Validators/AuthValidator.js (excerpt)
import { validate } from '@averoa/utilities';

class AuthValidator {
  login = validate({
    body: {
      email: {
        type: 'string',
        format: 'email',
        validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      },
      password: {
        type: 'string',
        validation: [{ run: (v) => v.validator.isLength(v.value, { max: 128 }), msg: 'must be at most 128 characters' }],
      },
    },
  });
}

export default new AuthValidator();
```

```js
// routes/api.js
import AuthValidator from '#app/Validators/AuthValidator.js';

router.post('/auth/login', 'AuthController@login', [AuthValidator.login]);
```

A field definition takes `type` (`string`, `integer`, `number`, `boolean`, `object`, `array`; strings from the query
string are coerced), `required` (default `true`), `default`, `enum` and `validation: [{ run, msg }]`, where `run`
receives `{ validator, value, raw, data }`. Any [Standard Schema](https://standardschema.dev) validator works too,
for example zod (`npm i zod`):

```js
import { z } from 'zod';
import { validate } from '@averoa/utilities';

router.get('/search', 'SearchController@index', [validate({
  query: z.object({ q: z.string().min(2), page: z.coerce.number().int().min(1).default(1) }),
})]);
```

A failure answers `422` in the same shape as model validation, plus the part that failed:

```json
{ "status": false, "data": { "column": "email", "message": ["email format required"], "in": "body" } }
```

On success the controller reads the parsed values from `req.validated.body`, `req.validated.query`,
`req.validated.params` and `req.validated.headers`. `req.body` is replaced with the parsed body (undeclared keys
removed; the original stays in `req.bodyRaw`). `req.query` is not changed, because Express 5 makes it a getter. See
the [`@averoa/utilities` README](https://github.com/budiherma1/AveroaUtilities#request-validation) for every option.

## API documentation

In development and test the app serves an OpenAPI 3.1 document of every `routes/api.js` route at
`GET /api/openapi.json`, and Swagger UI at `GET /api/docs`:

```bash
npm run dev
curl http://localhost:8888/api/openapi.json
open http://localhost:8888/api/docs
```

The document is generated from what the app already declares:

- **Routes**: every path and verb, with `:id` written as `{id}`, tagged by controller or model name.
- **`crud()` routes**: list, get, create, update and delete operations for the model, with the query filter
  parameters (`limit`, `page`, `orderBy`, `$select`, `$relations`, ...), the `{ status, metadata, data }` envelope and
  the `400` / `404` / `422` responses.
- **Models**: a schema per model from `static column`, with types from the `migration` hints, required flags and the
  rule messages. Hidden columns (`Users.password`, `Users.otp`) never appear in response schemas; `upload` columns are
  binary fields on `*Form` routes.
- **Authentication**: routes behind `AuthMiddleware` require the JWT bearer scheme (use **Authorize** in Swagger UI
  with the token from `/api/auth/login`).
- **`validate()`**: the request body and parameters it checks.

Describe a route further by chaining `.doc()`:

```js
router.post('/auth/login', 'AuthController@login', [AuthValidator.login]).doc({
  summary: 'Log in and get a JWT',
  tags: ['Auth'],
  responses: { 401: 'Invalid email or password' },
});
```

`doc()` accepts `summary`, `description`, `tags`, `operationId`, `deprecated`, `security` (`false` for public),
`request`, `responses`, `parameters`, `requestBody` and `exclude: true` (leave the route out). Change the whole
document in `AppProvider.openapi(doc)`, for example to set `servers` or add shared schemas. The full reference is in
the [`@averoa/core` README](https://github.com/budiherma1/AveroaCore#api-documentation-openapi).

The endpoints are off unless `NODE_ENV` is `development` or `test`. `OPENAPI_ENABLED=true` turns them on elsewhere
(the document lists every API route, so expose it only where that is acceptable); `OPENAPI_UI=false` keeps only the
JSON. The docs page loads Swagger UI from jsDelivr, pinned with Subresource Integrity, under its own
Content-Security-Policy; the rest of the app keeps the default CSP.

## Authentication

### JWT for the API

```bash
# the seeder creates demo@averoa.test with the password "password" (development data only)
curl -X POST http://localhost:8888/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@averoa.test","password":"password"}'
# {"status":true,"data":{"token":"eyJ...","type":"Bearer","expires_in":900,
#                        "refresh_token":"Qk3...","refresh_expires_in":2592000}}

curl http://localhost:8888/api/auth/me -H 'authorization: Bearer eyJ...'
# {"status":true,"data":{"id":11,"first_name":"Demo","last_name":"User","email":"demo@averoa.test",...}}

# when the access token expires, trade the refresh token for a new pair
curl -X POST http://localhost:8888/api/auth/refresh \
  -H 'content-type: application/json' -d '{"refresh_token":"Qk3..."}'
```

`expires_in` and `refresh_expires_in` are seconds (in 2.1.0 `expires_in` was the `TOKEN_EXPIRES_IN` string).
Upgrading an existing application: run `npm run migrate:up`; access tokens issued before (without the `tv` and `sid`
claims) are rejected, so clients log in again once.

| Endpoint | Body | Answer |
| --- | --- | --- |
| `POST /api/auth/login` | `{ email, password }` | `200` token pair; `401` invalid email or password; `422` missing field |
| `POST /api/auth/register` | `{ first_name, last_name?, email, password, address? }` | `201 { user, ...token pair }` and a verification email; `422` invalid field or email already registered |
| `POST /api/auth/refresh` | `{ refresh_token }` | `200` a new token pair, the presented refresh token is revoked; `401` unknown, expired, revoked or reused token |
| `POST /api/auth/logout` | none, JWT | `200`; ends this session (its refresh tokens and access tokens) |
| `POST /api/auth/logout-all` | none, JWT | `200`; ends every session of the user |
| `GET /api/auth/me` | none, JWT | `200` the user |

**How sessions work.** A login or a registration starts a session: a refresh token *family*. Its id is the `sid`
claim of the access tokens, which also carry `tv` (the user's `token_version`) and a unique `jti`. `JwtStrategy`
accepts an access token only while the user is active, `tv` equals `users.token_version` and the family still has a
live refresh token, so logging out takes effect at once rather than when the access token expires.

- **Rotation.** Every refresh revokes the presented token and issues the next one of the same family.
- **Reuse detection.** Presenting a token that was already rotated means two parties hold it (the client and an
  attacker), so the whole family is revoked: both must log in again. Two concurrent refreshes with the same token are
  handled the same way, so clients must refresh from one place: share the refresh in a single promise (or a lock)
  across browser tabs and retries, or the user is signed out.
- **Logout everywhere.** `logout-all` and a password reset increment `token_version` and revoke every refresh token.
  Call `AuthService.invalidateSessions(userId)` after changing a password or an email address in your own code.
- **Storage.** Refresh tokens and the reset / verification tokens are 256-bit random values; only their SHA-256 hash
  is stored (`refresh_tokens`, `user_tokens`), so a database leak does not reveal usable tokens. Lookups go through the
  hash, so no token is ever compared in application code. `app/Console/Kernel.js` deletes expired rows daily at 03:30
  (`npm run schedule:run`).
- **Emails after the response.** Verification and reset emails are sent after the response, so neither a slow SMTP
  server nor the timing reveals anything. `AppProvider.shutdown()` waits for the pending ones (`AuthService.settled()`)
  so a deploy does not drop them; a failed send is logged, not retried.

| Response | When |
| --- | --- |
| `422 { status: false, data: { column, message } }` | A required field is missing, not a string, or invalid |
| `401 { status: false, message: 'Invalid email or password' }` | Unknown email, wrong password, or soft-deleted user |
| `429 { status: false, message: 'Too many login attempts, please try again later.', code: 'ERATELIMIT' }` | Too many failed logins (see [Rate limiting](#rate-limiting)); `Retry-After` says how many seconds to wait |
| `401 { status: false, message: 'Unauthorized' }` | Missing, expired, invalid or revoked token on a route behind `AuthMiddleware` |
| `403 { status: false, message, code: 'EMAIL_NOT_VERIFIED' }` | `EnsureEmailVerified` on a user without a verified address |
| `429 { status: false, message }` + `Retry-After` | Rate limit or resend throttle |

### Email verification

Registration sends a link to `<FRONTEND_URL>/verify-email?token=...` (template
`resources/views/emails/verify-email.edge`, with a plain-text part). The front end posts the token to the API;
without a front end, `GET /api/auth/verify-email?token=...` works too.

| Endpoint | Answer |
| --- | --- |
| `GET /api/auth/verify-email?token=` / `POST /api/auth/verify-email { token }` | `200`; `400` invalid, expired or used link, or the address changed since it was sent |
| `POST /api/auth/resend-verification` (JWT) | `200` a new link (the previous one stops working); `429` + `Retry-After` within `EMAIL_VERIFICATION_THROTTLE` |

Links are single use and expire after `EMAIL_VERIFICATION_TTL`. Protect routes with `EnsureEmailVerified` after
`AuthMiddleware`:

```js
router.post('/', 'TeacherController@create', ['AuthMiddleware', 'EnsureEmailVerified']);
```

### Password reset

| Endpoint | Answer |
| --- | --- |
| `POST /api/auth/forgot-password { email }` | Always `200` with the same message; `422` only for a malformed address |
| `POST /api/auth/reset-password { token, password }` | `200`; `400` invalid, expired or used link; `422` missing token or invalid password |

`forgot-password` never reveals whether an account exists: the lookup, the token and the email happen after the
response is sent, so neither the body nor the response time depends on the address. At most one link per account is
sent per `PASSWORD_RESET_THROTTLE`, and a new link replaces the previous one. The link
(`<FRONTEND_URL>/reset-password?token=...`, template `resources/views/emails/reset-password.edge`) is single use and
expires after `PASSWORD_RESET_TTL`. A successful reset signs the user out of every session.

Registration does tell whether an address is taken (`422`, `email is already registered`); it is rate limited like
`forgot-password`.

### Rate limits

`AuthRateLimitMiddleware` limits the public authentication endpoints per client IP (`req.ip`, which follows
`TRUST_PROXY`) and endpoint. `register` and `forgot-password` count every request (`AUTH_RATE_LIMIT_MAX`), because
they create rows or send email; `refresh`, `reset-password` and `verify-email` count only failed requests
(`AUTH_RATE_LIMIT_FAILED_MAX`), so normal refreshes are never blocked. Over the limit they answer `429` with
`Retry-After`. The limiter runs before `validate()`, so malformed requests count too. The counters live in the
`RATE_LIMIT_STORE` store like the login limiter's: in memory per process, or shared by every instance with Redis
(see [Rate limiting](#rate-limiting)).

### Email

The emails are sent with `Mail` from `@averoa/utilities` (SMTP settings in `config/mail.js`) from
`MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME`, after the response, so a slow or failing SMTP server neither delays nor
fails the request; failures are logged. Settings live in `config/auth.js`.

### Authorization

`app/Providers/AuthProvider.js` registers the model policies and abilities of the `Gate` from `@averoa/utilities` at
startup. `app/Policies/TeacherPolicy.js` is the example: admins (`users.is_admin`) may do everything, owners
(`teacher.user_id`) may update and delete their teachers, and only admins may change the owner.

```js
import { can } from '@averoa/utilities';

// 401 without a user, 404 when the loader finds nothing, 403 when the policy denies
router.put('/:id', 'TeacherController@update', ['AuthMiddleware', can('update', findTeacher)]);

// in code
if (await Gate.allows(req.user, 'changeOwner', Teacher)) { /* ... */ }
```

### Files

| File | Role |
| --- | --- |
| `routes/api.js` | The auth routes, their rate limits, and the Teacher routes with `EnsureEmailVerified` and `can()` |
| `app/Controllers/AuthController.js`, `PasswordResetController.js`, `EmailVerificationController.js` | HTTP layer of the flows |
| `app/Services/AuthService.js` | The flows: tokens, rotation, logout, registration, verification, reset, emails |
| `app/Repositories/RefreshTokenRepository.js`, `UserTokenRepository.js` | Hashed token storage |
| `app/Strategies/JwtStrategy.js` | Verifies the bearer token, its token version and session; sets `req.user` and `req.auth` (the claims) |
| `app/Middleware/AuthMiddleware.js`, `EnsureEmailVerified.js` | Authentication, verified email |
| `app/Middleware/LoginRateLimitMiddleware.js`, `AuthRateLimitMiddleware.js` | Brute-force protection on login; rate limits on the other public auth endpoints |
| `app/Validators/AuthValidator.js` | `validate()` rules of the auth request bodies (also used for the OpenAPI document) |
| `app/Helpers/TokenHelper.js`, `PasswordHelper.js` | Random tokens, SHA-256, durations; scrypt hashing |
| `app/Repositories/UserRepository.js` | User lookup and password check; unknown emails are checked against a dummy hash so that response time does not reveal which accounts exist |
| `app/Models/Users.js` | Lower-cases `email` and hashes `password` in `$beforeInsert` / `$beforeUpdate`; hides `password`, `otp` and `token_version`; `is_admin`, `email_verified_at` and `token_version` are not client-writable |
| `app/Providers/AuthProvider.js`, `app/Policies/TeacherPolicy.js` | Authorization |
| `config/auth.js` | Lifetimes, throttles, sender and email links |

To protect any route, declare it inside `router.middleware(['AuthMiddleware'], () => { ... })` or pass
`['AuthMiddleware']` as its middleware argument.

### Sessions for server-rendered pages

`LocalStrategy` is a passport-local strategy that reads `email` and `password`, verifies the password and stores only
the user id in the session. `LoginMiddleware` runs it. The boilerplate does not mount it; a minimal login route looks
like this:

```js
// routes/web.js
router.post('/login', (req, res) => res.redirect('/'), ['LoginMiddleware']);
```

The login form must send the CSRF token (see [Views](#views)). On failure passport answers `401 Unauthorized`.
passport regenerates the session on login, so the CSRF token changes: read it again after logging in.

For per-request helpers, `@averoa/utilities/AuthSandbox.js` default-exports `Auth(req)` with `check()`, `user()` and
`logout()` (a promise).

### Writing a strategy

`node averoa make:strategy ApiKeyStrategy` creates `app/Strategies/ApiKeyStrategy.js` and registers it in
`app/Strategies/index.js`. Implement `config()`, which core calls once at startup, and use `authenticate()` from a
middleware:

```js
// app/Middleware/ApiKeyMiddleware.js
import { ApiKeyStrategy } from '#strategies';

class ApiKeyMiddleware {
  handle(req, res, next) {
    ApiKeyStrategy.authenticate(req, res, next);
  }
}

export default new ApiKeyMiddleware();
```

`passport.authenticate(...)` returns a middleware function, which `authenticate()` must call with
`(req, res, next)`; the generated template already does.

## Views

Views are [Edge 5](https://edgejs.dev) templates in `resources/views`. Render them with `res.render()`; dot notation
maps to sub-folders, so `res.render('users.list')` renders `resources/views/users/list.edge`.

```js
res.render('welcome', { name: 'Averoa' });
```

```edge
<ul>
  @each(user in data)
    <li>{{ user.first_name }}</li>
  @end
</ul>
```

- **Globals** returned by `ViewProvider.global()` are available in every template.
- **`csrfToken`** is available in every template while CSRF protection is enabled. Forms that change data must send it:

  ```html
  <form method="post" action="/profile">
    <input type="hidden" name="_csrf" value="{{ csrfToken }}">
  </form>
  ```

- **Caching.** Compiled templates are cached when `NODE_ENV=production`.
- **Content Security Policy.** The default CSP only allows scripts from the application's own origin. Inline
  `<script>` blocks and CDN scripts are blocked unless you relax `script-src` in `AppProvider.helmet()`.

The same Edge instance is exported as `View` from `@averoa/utilities` (`await View.render('email', data)`) and is used
by `Mail` for HTML templates.

## Mail, queues and jobs

### Sending mail

```js
import { Mail } from '@averoa/utilities';

await Mail.init()
  .from('info@example.com')
  .to('customer@example.com')
  .subject('Welcome')
  .html('email', { name: 'Averoa' }) // Edge template, or a raw HTML string containing '<'
  .text('Welcome to Averoa')
  .send();
```

| Method | Description |
| --- | --- |
| `from()`, `to()`, `subject()`, `text()` | Message fields |
| `html(viewOrHtml, data?)` | Render an Edge template, or use the string as HTML when it contains `<` |
| `attachments(list)` | nodemailer attachments |
| `additional(options)` | Extra nodemailer message options |
| `queue(name?)` | Publish to RabbitMQ instead of sending. Without a name, the queue is `config/mail.js` `queue`, `MAIL_QUEUE`, or `mail`. |
| `send()` | Sends through the shared nodemailer transport (from `config/mail.js`), or publishes and resolves to `{ status: 'queued', channel, data }`. |

### Publishing to a queue

```js
import { Queue } from '@averoa/utilities';

await Queue('reports', { reportId: 42 });
```

`Queue(name, data, options?)` publishes a persistent message to a durable queue over one shared AMQP connection and
resolves after the broker confirms it. Strings are sent as text, Buffers as-is, anything else as JSON. The connection
is closed during graceful shutdown.

### Running the mail worker

`EmailSubscriberJob` wraps `startMailWorker()` from `@averoa/utilities`. It consumes the mail queue and sends each
message. Failed sends are re-published up to `maxRetries` (default 3) and then rejected; malformed messages are
dropped; the consumer reconnects with exponential backoff when the broker connection is lost.

Run it as a separate process next to the web server:

```bash
npm run worker:mail
```

`workers/mail.js` loads `.env` through `@averoa/core/env.js` before it imports `@averoa/utilities`, then starts
`startMailWorker()` on `RABBITMQ_SERVER` and the queue from `config/mail.js` `queue`, `MAIL_QUEUE` or `mail`. It exits
with code 1 when RabbitMQ is not configured or unreachable. On `SIGTERM` or `SIGINT` it stops consuming, waits for the
mails being sent, closes the AMQP connection and exits; after `SHUTDOWN_TIMEOUT` ms it exits with code 1. To pass
options (`{ queue, prefetch, maxRetries }`), edit the `startMailWorker()` call in the file, or call
`EmailSubscriberJob(options)` from your own code.

### Jobs

Background jobs (`app/Jobs`) and scheduled tasks (`app/Console/Kernel.js`) are described in
[Jobs and scheduling](#jobs-and-scheduling).

## Jobs and scheduling

Background jobs and the scheduler come from `@averoa/utilities` (`Job`, `startJobWorker`, `Schedule`,
`startScheduler`); its README has the full reference. They need RabbitMQ (`RABBITMQ_SERVER`). The application runs up
to three kinds of process:

| Process | Command | Scale |
| --- | --- | --- |
| Web server | `npm start` | as many as you need |
| Job worker | `npm run worker:jobs` (`workers/jobs.js`) | as many as you need |
| Scheduler | `npm run schedule:run` (`workers/scheduler.js`) | **exactly one** |

### Writing a job

```bash
node averoa make:job SendInvoiceJob
```

creates `app/Jobs/SendInvoiceJob.js` and adds it to `app/Jobs/index.js`:

```js
import { Job } from '@averoa/utilities';

class SendInvoiceJob extends Job {
  static tries = 3;                       // total attempts
  static backoff = [10000, 60000];        // ms before retry 1, 2, ... (or a number, or (retry) => ms)
  static timeout = 60000;                 // ms per attempt
  // static queue = 'billing';            // default: JOBS_QUEUE or 'jobs'

  async handle({ invoiceId }, { attempt, signal }) {
    // throw (or reject) to retry
  }

  async failed({ invoiceId }, error) {
    // called once, after the last attempt failed
  }
}

export default SendInvoiceJob;
```

Dispatch it from a controller, a model hook or another job:

```js
import { SendInvoiceJob } from '#jobs';

await SendInvoiceJob.dispatch({ invoiceId: invoice.id });                    // as soon as a worker is free
await SendInvoiceJob.dispatch({ invoiceId: invoice.id }, { delay: 60_000 }); // in a minute (ms or a Date)
await SendInvoiceJob.dispatchSync({ invoiceId: invoice.id });                // now, in this process, no RabbitMQ
```

The payload is JSON: pass ids, not model instances, and read the current row in `handle()`. Delayed jobs and retries
with a backoff go through per-delay TTL queues (`<queue>.delay.<ms>`) that dead-letter into the job queue, so no
RabbitMQ plugin is needed. Jobs run at least once: a worker that dies mid-job leaves the message to be delivered again,
so make `handle()` safe to repeat.

The boilerplate ships two jobs:

| Job | What it does |
| --- | --- |
| `SendWelcomeEmailJob` | `dispatch({ userId })`: mails `resources/views/emails/welcome.edge` to the user (from `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME`, like the auth emails). Users that no longer exist or are soft-deleted get nothing. 5 tries with exponential backoff from 10 s. |
| `PruneSoftDeletedJob` | `dispatch({ days = 30, models? })`: hard-deletes rows whose `deleted_at` is older than `days` days, in every model with timestamps or in the named `#models` only. Scheduled daily at 03:00. |

`EmailSubscriberJob` (the mail worker) and `GenerateAppTokenJob` (`npm run generate:token`) are plain functions, not
`Job` classes, and the job worker ignores them.

### Running the job worker

```bash
npm run worker:jobs
```

`workers/jobs.js` loads `.env`, binds the models to the database, and runs every `Job` class exported by
`app/Jobs/index.js`, consuming the queues those jobs use. `JOBS_WORKER_QUEUES` limits it to a comma-separated list of
queues (for example a separate worker for a slow queue) and `JOBS_CONCURRENCY` sets how many jobs run at the same time
per queue. It reconnects when the broker restarts. On `SIGTERM` or `SIGINT` it stops taking jobs, waits for the running
ones, closes the AMQP and database connections and exits; after `SHUTDOWN_TIMEOUT` ms it exits with code 1, and the
unfinished jobs are delivered again.

A job is looked up by its registered name in the classes exported from `app/Jobs/index.js`; nothing in a message
decides which file is loaded. A job that fails after its last try is recorded in the queue `<queue>.failed` (with the
payload and the error) and its `failed()` method is called. Inspect or purge that queue in the RabbitMQ management UI;
move the records back to the job queue with:

```bash
npm run queue:retry                  # JOBS_QUEUE
npm run queue:retry -- billing 100   # a queue, at most 100 jobs
```

### Scheduling tasks

The schedule lives in `app/Console/Kernel.js`:

```js
import { PruneSoftDeletedJob, SendReportJob } from '#jobs';

export default function kernel(schedule) {
  schedule.job(PruneSoftDeletedJob, { days: 30 }).dailyAt('03:00');
  schedule.job(SendReportJob).cron('0 8 * * 1-5').timezone('Asia/Jakarta');
  schedule.call(() => cleanTmpFiles(), 'clean-tmp').everyFifteenMinutes().withoutOverlapping();
}
```

| Frequency | Options |
| --- | --- |
| `cron('*/5 * * * *')` (5 fields, or 6 with seconds), `everyMinute()`, `everyTwoMinutes()`, `everyFiveMinutes()`, `everyTenMinutes()`, `everyFifteenMinutes()`, `everyThirtyMinutes()`, `hourly()`, `hourlyAt(17)`, `daily()`, `dailyAt('03:00')`, `weekly()`, `weeklyOn(1, '08:00')`, `monthly()`, `monthlyOn(15, '12:00')` | `timezone('Europe/Paris')`, `withoutOverlapping()` (skip a run while the previous one is still running; for `job()` it only covers the dispatch), `name('...')` |

`schedule.job()` dispatches the job, which then runs on a job worker; `schedule.call()` runs the function inside the
scheduler process. Run it with:

```bash
npm run schedule:run             # long-running; SIGTERM / SIGINT waits for running tasks and exits
npm run schedule:run -- --once   # run what is due in the current minute and exit
```

Use `--once` when a system cron (`* * * * * cd /app && npm run schedule:run -- --once`) or a Kubernetes CronJob starts
it every minute instead. Cron expressions are parsed by [croner](https://github.com/hexagon/croner) (a dependency of the
boilerplate). Times use `SCHEDULE_TIMEZONE`, else the process time zone (`TZ`), unless an event sets its own.

> [!IMPORTANT]
> Run **one** scheduler process per application. Every running scheduler fires every task, so two of them dispatch
> every job twice. Job workers can be scaled freely. If you need more than one scheduler for availability, pass a
> `lock` to `startScheduler()` backed by a shared store (for example Redis `SET key NX PX`), as described in the
> `@averoa/utilities` README.

### Testing jobs

`dispatchSync()` runs a job in the test process (with the same JSON round trip as `dispatch()`), and `fakeJobs()` from
`@averoa/utilities` records `dispatch()` calls instead of publishing them:

```js
import { fakeJobs } from '@averoa/utilities';

const fake = fakeJobs();
// ... call the code that dispatches
assert.equal(fake.dispatched[0].job, 'SendWelcomeEmailJob');
fake.restore();
```

### Running workers in production

Run the web server, the job worker(s), the mail worker (if you queue mail) and one scheduler as separate processes
from the same code and the same environment. Each of them stops cleanly on `SIGTERM`; give them a stop grace period
longer than `SHUTDOWN_TIMEOUT`, and `SHUTDOWN_TIMEOUT` longer than your slowest job.

With Docker, build one image and start it with a different command per service:

```yaml
# docker-compose.yml (excerpt)
x-app: &app
  image: my-averoa-app
  env_file: .env
  restart: unless-stopped
  stop_grace_period: 30s
  depends_on: [rabbitmq]

services:
  web:
    <<: *app
    command: ["node", "server.js"]
    ports: ["3000:3000"]
  worker:
    <<: *app
    command: ["node", "workers/jobs.js"]
    deploy:
      replicas: 2                  # scale job workers freely
  scheduler:
    <<: *app
    command: ["node", "workers/scheduler.js"]
    deploy:
      replicas: 1                  # never more than one
  rabbitmq:
    image: rabbitmq:3-management
```

Start the processes with `node` (as above) rather than `npm run`, so `SIGTERM` reaches Node directly. With a process
manager such as PM2 or systemd, the same applies: one entry per command, `workers/scheduler.js` with a single instance.
On Kubernetes, use a Deployment for the web server and one for the job workers, and either a one-replica Deployment
running `node workers/scheduler.js` (with the `Recreate` strategy, so two never overlap during a rollout) or a CronJob
running `node workers/scheduler.js --once` every minute (`concurrencyPolicy: Forbid`).

Delayed jobs and backoffs live in RabbitMQ, not in the worker, so they survive a worker restart. Queues are durable and
messages persistent; keep the RabbitMQ data on a persistent volume.

## File uploads

AveroaJS offers two upload paths. Both keep files in memory while the request is parsed and write them through
`UploadProvider`, which stores them on the local disk (`UPLOAD_DRIVER=local`, the default) or in an S3 bucket
(`UPLOAD_DRIVER=s3`, see [Storing uploads in S3](#storing-uploads-in-s3)).

### Upload columns on `*Form` crud routes

Flag a model column with `upload: true` and use `postForm`, `putForm` or `patchForm` inside `crud()`:

```js
// app/Models/Teacher.js
images: {
  migration: (m) => m.table.string(m.column, 200).nullable(),
  flag: { required: false, search: false, upload: true },
},
```

```js
// routes/api.js
router.crud('Teacher', 'teachers', () => {
  router.postForm('/', 'TeacherController@create');
  router.putForm('/:id', 'TeacherController@update');
});
```

`Crud.create` and `Crud.update` store each file under `storages/upload/<route prefix>/` and save the relative path,
such as `teachers/0c5e...-photo.png`, in the column. With `UPLOAD_DRIVER=s3` the same string is the object key.
`Crud.update` deletes the previous file. Required upload columns
are only enforced on create.

Any file type is accepted on these routes. Limits: `UPLOAD_MAX_FILE_SIZE` (default 10 MB, `413` when exceeded),
`UPLOAD_MAX_FILES` (default 10), 100 fields and 1 MB per field; `router.config({ upload: { limits } })` overrides
them.

### `UploadImageMiddleware`

`UploadImageMiddleware` accepts a single file in the `image` field, only `image/jpeg`, `image/png`, `image/gif` or
`image/webp`, up to `UPLOAD_MAX_FILE_SIZE` (default 2 MB). It answers `413` for a file that is too large, `422` for
other upload errors and `400` for a malformed multipart body. The file is kept in memory and exposed twice:

- `req.file`, for your own controllers. Store it yourself:

  ```js
  import { UploadProvider } from '#providers';

  const stored = await UploadProvider.upload(req.file, 'avatars'); // 'avatars/<uuid>-<name>'
  ```

- `req.files = [req.file]`, which the `crud()` hooks read. When the model has a column with the field's name flagged
  `upload: true`, `validationRouter` moves the file to `req.dataFiles` and `Crud.create` / `Crud.update` store it as
  described above, with the image-only filter and the 2 MB limit:

  ```js
  // app/Models/Teacher.js: image: { migration: ..., flag: { required: false, search: false, upload: true } }
  router.crud('Teacher', 'teachers', () => {
    router.post('/', 'TeacherController@create', ['AuthMiddleware', 'UploadImageMiddleware']);
  });
  ```

For another field name, pass an instance instead of the name:

```js
import { UploadImageMiddleware } from '#app/Middleware/UploadImageMiddleware.js';

router.post('/', 'TeacherController@create', [new UploadImageMiddleware('images')]);
```

Use it on routes declared with `post` / `put` / `patch`, not on `*Form` routes, which parse the multipart body
themselves after every middleware. Do not add it to `MiddlewareProvider` for the same reason.

### `UploadProvider`

| Method | Description |
| --- | --- |
| `upload(file, route, oldFile?)` | Store a multer memory file as `<route>/<uuid>-<name>` (sanitised) with the active driver and delete `oldFile` if given. Returns the stored name: a path relative to `storages/upload` (`local`) or the object key (`s3`). Save this string; build links with `url()`. |
| `remove(name)` | Delete a stored file with the active driver. Names `upload()` cannot produce (`..`, absolute paths, other characters) are ignored and return `false`. |
| `url(name)` | Public URL of a stored name: `/upload/<name>` (`local`) or `S3_PUBLIC_URL/<name>` (`s3`, defaults to the bucket's endpoint URL). `null` for an unsafe name. |
| `driver()` | The active driver from `UPLOAD_DRIVER`. |
| `local(...)`, `awsS3(...)` | The drivers behind `upload()`, callable directly. |
| `removeLocal(name)`, `removeS3(key)` | The drivers behind `remove()`. |

### Storing uploads in S3

`UPLOAD_DRIVER=s3` stores uploads in AWS S3 or any S3-compatible service such as MinIO,
Cloudflare R2 or DigitalOcean Spaces. The SDK, `@aws-sdk/client-s3`, is listed in `optionalDependencies` and loaded
the first time a file is stored, so `npm ci` and `npm ci --omit=dev` (the production Docker image) install it. If you
only use local storage you can leave it out with `npm ci --omit=optional`; with `UPLOAD_DRIVER=s3` the first upload
then fails with `UPLOAD_DRIVER=s3 needs the @aws-sdk/client-s3 package`.

```ini
UPLOAD_DRIVER=s3
S3_BUCKET=my-app-uploads
S3_REGION=eu-west-1
# S3-compatible services only:
# S3_ENDPOINT=http://localhost:9000
# S3_FORCE_PATH_STYLE=true
# omit on AWS to use the IAM role / default credential chain:
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
# optional: CDN or custom domain used by UploadProvider.url()
S3_PUBLIC_URL=https://cdn.example.com
```

- **Keys.** Objects get the same sanitised `<route>/<uuid>-<name>` as local files, and that key is what
  `upload()` returns and `Crud` saves in the column. Replacing a file uploads the new object first, then deletes the
  old one; if that delete fails, the upload still succeeds and a warning is logged.
- **Headers.** `Content-Type` comes from the file extension, never from the client. Following the `/upload` rules,
  only extensions on the inline allowlist (`UPLOAD_INLINE_EXTENSIONS` or `AppProvider.uploads()`; raster images by
  default) are stored without `Content-Disposition`. Everything else gets
  `Content-Disposition: attachment; filename="<key name>"`, and HTML, SVG, XML, JavaScript and CSS are stored as
  `application/octet-stream` unless their extension is allowlisted.
- **Serving.** A bucket cannot send the sandbox CSP and `nosniff` headers that `/upload` adds, so serve it from its own
  domain (the S3 endpoint or a CDN), never from a path or subdomain that shares cookies with the application, and add
  those headers at the CDN if you can. Make the bucket (or a CDN in front of it) publicly readable only if the files
  are meant to be public; for private files keep the bucket private and generate presigned URLs with
  `@aws-sdk/s3-request-presigner`.
- **Permissions.** The credentials need `s3:PutObject` and `s3:DeleteObject` on the bucket's objects.

### Serving uploads

`storages/upload` is served at `/upload`. Every response carries `X-Content-Type-Options: nosniff` and
`Content-Security-Policy: default-src 'none'; sandbox`. Only extensions on the inline allowlist (raster images by
default, see `UPLOAD_INLINE_EXTENSIONS`) are shown in the browser; everything else, including SVG and HTML, is sent
with `Content-Disposition: attachment`. With `UPLOAD_DRIVER=s3` the files are served by the bucket, not by `/upload`.

## Database: migrations and seeds

The knex CLI is a project dependency. The npm scripts run it with the knexfile shipped in `@averoa/core`, which reads
`.env` and `config/database.js` from the application root and uses `database/migrations` and `database/seeds`.

| Script | Description |
| --- | --- |
| `npm run migrate:make <name>` | Create a migration file |
| `npm run migrate:up` | Run all pending migrations |
| `npm run migrate:down` | Roll back the last batch |
| `npm run migrate:list` | List completed and pending migrations |
| `npm run seed:make <name>` | Create a seed file |
| `npm run seed:run` | Run every seed file, in file-name order |

`migrate:make` and `seed:make` create ES modules from the templates in `database/stubs` (`migration.stub`,
`seed.stub`), which `config/database.js` passes to knex as `migrations.stub` and `seeds.stub`. Edit the templates to
change what new files look like. A generated migration looks like this once filled in:

```js
export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('phone', 20).nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('phone');
  });
}
```

Model-based migrations created by `make:crud` are already ES modules and call `Model.migrationUp()` /
`Model.migrationDown()`.

**Seeds replace data.** `Model.seeder()` and `Model.seederCustom()` delete every row of their table before inserting,
so `npm run seed:run` resets the seeded tables. The shipped seeds create 10 users, the demo user
`demo@averoa.test` (an admin), the member `member@averoa.test` (not an admin), 10 teachers and 10 rooms. Both known
accounts have a verified email address. Every seeded user has the password `password`.

Do not edit a migration that has already run in a shared environment. Add a new one, as
`database/migrations/20261116000000_add_password_to_users.js` does, or the authentication migrations:
`20261116100000_add_auth_columns_to_users.js` (`email_verified_at`, `token_version`, `is_admin`),
`20261116100100_create_refresh_tokens_table.js` and `20261116100200_create_user_tokens_table.js`.

## CLI generators

`averoa.js` runs the generators in `@averoa/core`:

```bash
node averoa --help
node averoa make:crud --help
```

| Command | Creates | Options |
| --- | --- | --- |
| `make:controller <name>` | `app/Controllers/<name>.js` | `-f, --force` |
| `make:middleware <name>` | `app/Middleware/<name>.js` | `-f, --force` |
| `make:model <name>` | `app/Models/<name>.js`, added to `app/Models/index.js`; with `-m` a migration built from its columns, with `-s` a seeder | `-t, --table <table>` (default: the lower-cased name), `-m, --migration`, `-s, --seed`, `-f, --force` |
| `make:policy <name>` | `app/Policies/<name>.js`; register it in `app/Providers/AuthProvider.js` (the command prints the line) | `--model <model>` (default: the name without `Policy`), `-f, --force` |
| `make:validator <name>` | `app/Validators/<name>.js`, rule sets to use as route middleware | `-f, --force` |
| `make:helper <name>` | `app/Helpers/<name>.js`, added to the index | `-f, --force` |
| `make:job <name>` | `app/Jobs/<name>.js` (a `Job` subclass), added to the index | `-f, --force` |
| `make:repository <name>` | `app/Repositories/<name>.js`, added to the index | `-f, --force` |
| `make:strategy <name>` | `app/Strategies/<name>.js`, added to the index | `-f, --force` |
| `make:migration <name>` | `database/migrations/<timestamp>_<name>.js` | `-c, --create <table>`, `-t, --table <table>`, `-f, --force` |
| `make:test <name>` | `tests/<name>.test.js` (`npm test` picks it up) | `--http` (start the app and call it over HTTP), `-f, --force` |
| `make:crud <tables>` | per table: model, migration, seeder and controller; `crud()` routes in `routes/api.js` | `-i, --init`, `-f, --force` |

A typical new resource:

```bash
node averoa make:model Post --table posts -m -s   # model, migration from its columns, seeder
node averoa make:controller PostController
node averoa make:validator PostValidator           # [PostValidator.store] as route middleware
node averoa make:policy PostPolicy                 # then add [Post, PostPolicy] to AuthProvider.policies()
node averoa make:test posts --http
npm run migrate:up
```

Names must be JavaScript identifiers (`make:migration` and `make:test` take file names: letters, digits, `_`, `-`)
and table names may contain only letters, digits and underscores. Existing files
are never overwritten without `--force`.

### `make:crud`

```bash
node averoa make:crud books,user_categories
```

For `user_categories` this creates the model `UserCategories` (table `user_categories`), the controller
`UserCategoriesController`, `database/migrations/<timestamp>_UserCategories.js`,
`database/seeds/<timestamp>_UserCategories.js`, and these routes, inserted before `export default router;` in
`routes/api.js`:

```js
router.crud('UserCategories', 'user-categories', () => {
  router.get('/', 'UserCategoriesController@findAll');
  router.get('/:id', 'UserCategoriesController@findOne');
  router.post('/', 'UserCategoriesController@create');
  router.put('/:id', 'UserCategoriesController@update');
  router.delete('/:id', 'UserCategoriesController@delete');
});
```

The generated model has an `id` and a sample `email` column; edit it, then run `npm run migrate:up` and
`npm run seed:run`.

`--init` writes a new `routes/api.js` containing only the generated routes. The boilerplate already has a
`routes/api.js`, so `--init` needs `--force`, which replaces the file, including the auth routes. Every target file is
checked before anything is written: when `--init` is used without `--force` (or any target already exists), the
command fails and nothing is created.

## Utilities

`@averoa/utilities` exports the building blocks used throughout this README.

| Export | Description |
| --- | --- |
| `DB` | The shared Knex instance from `config/database.js`: `DB('users')`, `DB.raw()`, `DB.transaction()`. `getDB()` / `DB.ready` resolve once it exists. |
| `Model`, `Crud`, `FilterSearch` | See [Models](#models) and [CRUD and query filters](#crud-and-query-filters). |
| `Mail`, `Queue`, `startMailWorker`, `closeQueue` | See [Mail, queues and jobs](#mail-queues-and-jobs). |
| `View` | The shared Edge instance. |
| `Log` | winston logger: JSON lines with timestamp, level, message and `requestId`, sensitive fields redacted. See [Logging](#logging). |
| `Fetch` | An axios instance configured by `config/fetch.js`. |
| `Validator` | The [validator](https://www.npmjs.com/package/validator) package. |
| `appRoot`, `appPath`, `importApp` | Application-root helpers, also available from `@averoa/utilities/paths`. |

```js
import { DB, Log } from '@averoa/utilities';
import { Users } from '#models';

const users = await Users.query().whereNull('deleted_at');      // Objection
const emails = await DB.select('id', 'email').from('users');    // Knex
Log.info(`loaded ${users.length} users`);
```

Long or reused queries belong in `app/Repositories` (`node averoa make:repository ReportRepository`).

## Security

| Area | Default behaviour |
| --- | --- |
| Headers | helmet 8. The CSP allows the application's own scripts, styles, fonts and images, inline styles and Google Fonts. `upgrade-insecure-requests` is added in production. Change it in `AppProvider.helmet()`. |
| CSRF | Session synchronizer token, see below. |
| Sessions | `httpOnly`, `sameSite: 'lax'`, `saveUninitialized: false`. The cookie is `secure` unless `NODE_ENV` is `development` or `test`. Stored in memory or, with `SESSION_STORE=redis`, in Redis. |
| Rate limiting | `/api` limited per client IP; `POST /api/auth/login` limited per IP and email and per IP on failed attempts. See below. |
| CORS | Whitelist-based, see below. |
| Bodies | JSON and urlencoded bodies are limited to `BODY_LIMIT`. |
| Uploads | Size and count limits; sanitised file names that cannot leave `storages/upload`; sandboxed serving. See [File uploads](#file-uploads). |
| Passwords | scrypt (N=16384, r=8, p=1) with a random salt, compared in constant time. |
| Query filters | Column names are validated against the model; values are bound parameters; database error messages are not returned to clients. |
| Errors | No stack traces and no 5xx details unless `NODE_ENV` is `development` or `test`. |

### CSRF

- `GET`, `HEAD` and `OPTIONS` requests always pass.
- **Web routes** (everything outside `/api`): every other method must send the session's token, either as the `_csrf`
  body field or the `x-csrf-token` header. Views receive it as `csrfToken`; handlers can call `req.csrfToken()`.
- **`/api` routes** are checked only when the request is authenticated by the session cookie and has no
  `Authorization` header. Token-based API clients and anonymous requests are not affected. A browser front end that
  logs in with the session must send `x-csrf-token`; expose the token with a route such as
  `router.get('/csrf-token', (req, res) => res.json({ token: req.csrfToken() }))`.
- **Multipart forms** must send the header, because the CSRF check runs before the multipart body is parsed.
- A missing or wrong token answers `403` with `code: 'EBADCSRFTOKEN'`. Set `CSRF_ENABLED=false` to disable the check.

### CORS

`CORS_WHITELIST` accepts exact origins (`https://app.example.com`), leading subdomain wildcards
(`https://*.example.com` matches subdomains but not `example.com` itself; `*.example.com` allows http and https) and
`*`. An invalid entry stops the application at startup.

| Situation | Behaviour |
| --- | --- |
| No `Origin` header, or same-origin request | Allowed |
| Origin in the whitelist | Allowed, with credentials |
| Origin allowed only by a `*` entry | Allowed **without** credentials (`Access-Control-Allow-Origin: *`), in every environment |
| Origin not in the whitelist | `403` |
| Empty whitelist, `NODE_ENV` `development` or `test` | Every origin allowed, with credentials |
| Empty whitelist, any other `NODE_ENV` | Every origin allowed **without** credentials (`Access-Control-Allow-Origin: *`) |

Same-origin detection compares the `Origin` host and port with the request's `Host`; the scheme is compared only when
`TRUST_PROXY` trusts a proxy.

### Rate limiting

`@averoa/core` mounts a global limiter on `/api` (`RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS`, default 100
per minute, per client IP) before body parsing and sessions. Responses carry the standard `RateLimit` and
`RateLimit-Policy` headers; over the limit the answer is `429` with `Retry-After` and
`{ status: false, message, code: 'ERATELIMIT' }` (JSON for `/api` and JSON clients, an HTML page otherwise).

`POST /api/auth/login` has a stricter limiter, `app/Middleware/LoginRateLimitMiddleware.js`. Only failed attempts
count (a successful login gives its attempt back):

- 5 failures per IP and email in 15 minutes (`LOGIN_RATE_LIMIT_MAX`), after which even the right password gets `429`
  until the window ends. The email is lower-cased and trimmed, and only its SHA-256 hash is used as a key;
- 50 failures per IP in 15 minutes for any email (`LOGIN_RATE_LIMIT_IP_MAX`), against credential stuffing.

Add limits to your own routes with `rateLimit()` from `@averoa/core`. Give every limiter a unique `name` (its key in
a shared store) and create it once, at module level:

```js
// routes/api.js
import { rateLimit } from '@averoa/core';

const exportLimit = rateLimit({ name: 'export', windowMs: 60 * 60 * 1000, limit: 10 });
router.get('/reports/export', 'ReportController@export', ['AuthMiddleware', exportLimit]);
```

Limits are counted per client IP, so `TRUST_PROXY` matters: behind a reverse proxy set it (e.g. `1`), or every client
shares the proxy's address and one user can block everyone; without a proxy keep it `false`, or clients can choose
their IP with `X-Forwarded-For` and escape the limit. With several instances use `RATE_LIMIT_STORE=redis` (the
default with `SESSION_STORE=redis`), otherwise each instance counts on its own and the effective limit is multiplied.

### Production checklist

- [ ] `NODE_ENV=production`.
- [ ] `TOKEN_SECRET` and `SESSION_SECRET` set to long random values (`npm run generate:token`), stored outside the
      repository.
- [ ] A persistent session store: `SESSION_STORE=redis` with `REDIS_URL` (`npm install redis connect-redis
      rate-limit-redis`), or a `store` returned from `AppProvider.session()`. The default MemoryStore logs a warning
      outside development and test, leaks memory and does not work across processes. With Redis, the application
      refuses to start while Redis is unreachable, so start Redis first.
- [ ] Redis protected: password or ACL user in `REDIS_URL`, not reachable from the internet, TLS (`rediss://`) when it
      crosses an untrusted network, and a `SESSION_REDIS_PREFIX` per application if several share it.
- [ ] `TRUST_PROXY` set when running behind a TLS-terminating proxy, and only then. The session cookie is `secure`, so
      browsers only receive it over HTTPS as seen by Express, and the rate limiters key on the client IP it yields.
- [ ] Rate limits reviewed: `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` fit your API's traffic, `RATE_LIMIT_STORE=redis`
      when more than one instance runs, and the login limits (`LOGIN_RATE_LIMIT_*`) kept strict.
- [ ] `CORS_WHITELIST` set to your real front-end origins. It is empty in `.env.example`, which outside development
      allows every origin without credentials, so a cross-origin front end that logs in with cookies needs it.
- [ ] Database credentials set, the driver listed in `dependencies` (`better-sqlite3` is only a devDependency), and
      `npm run migrate:up` run as part of the deployment.
- [ ] `npm run seed:run` **not** run against production data: it deletes seeded tables and creates the demo user with a
      known password.
- [ ] `FRONTEND_URL`, `MAIL_FROM_ADDRESS` and the SMTP settings set, so verification and reset emails are delivered
      with working links. Behind a proxy, `TRUST_PROXY` set so the auth rate limits see client IPs, not the proxy's.
- [ ] Sample routes (`/users`, `POST /api/users`, `/teacher`, `/api/teachers`, `/api/v2/*`) removed or protected. The
      Teacher writes require a JWT and `POST /api/users` an admin; `/users` and the Teacher reads are public.
- [ ] `OPENAPI_ENABLED` unset or `false`, unless the API description should be public (it is off by default outside
      development and test).
- [ ] `storages/upload` writable and persistent. With file logging, `storages/logs` too: logs are appended to
      indefinitely; rotate them with your platform's tools. In production `Log` writes to the file only unless
      `LOG_CHANNEL` says otherwise.
- [ ] In containers: `LOG_CHANNEL=stdout` and `LOG_FORMAT=json`, so the application and access logs are JSON lines on
      stdout for the platform's log collector and nothing is written to the container filesystem.
- [ ] Liveness probe on `/health`, readiness probe on `/ready` (see [Health checks](#health-checks)), and any checks
      your app depends on (Redis, an upstream API) added in `AppProvider.health()`.
- [ ] `SHUTDOWN_DELAY` set (for example `5000`) behind a load balancer or on Kubernetes, and the platform's grace
      period longer than `SHUTDOWN_DELAY + SHUTDOWN_TIMEOUT`.
- [ ] `TRUST_REQUEST_ID=true` only when your proxy sets or overwrites `X-Request-Id`; leave it unset when the proxy
      passes the client's header through (nginx and AWS ALB do by default).
      without `--omit=optional`).
- [ ] Started with `npm start` (`node server.js`) under a process manager or container runtime, not `npm run dev`.
      On `SIGTERM` `/ready` answers `503`, then (after `SHUTDOWN_DELAY`) the server stops accepting connections, calls
      `AppProvider.shutdown()`, closes the database, queue and Redis connections, and exits; after `SHUTDOWN_TIMEOUT` ms it
      exits with code 1.
- [ ] If you use jobs or the schedule: `npm run worker:jobs` running (one or more) and `npm run schedule:run` running
      **once**, under the same process manager, with `SHUTDOWN_TIMEOUT` longer than your slowest job.

## Observability

### Request IDs

Every request gets an id, available as `req.id`, returned in the `X-Request-Id` response header, included as
`requestId` in JSON error responses (`{ "status": false, "message": "Not Found", "requestId": "..." }`), shown on the
HTML error page, and added to every log line written while the request is handled. Users can quote it in bug
reports, and you can find every line of that request with one search.

The id is a random UUID unless the request carries a **trusted** and **valid** `X-Request-Id`:

- trusted: `TRUST_REQUEST_ID=true`, set when a proxy in front of the app sets or overwrites the header. Otherwise a
  client could choose its own id;
- valid: 1 to 128 characters from `A-Z a-z 0-9 - _ . : + = / @`. Anything else is replaced, never echoed.

Anywhere in the request (a controller, a repository, a model hook) the id is available without passing `req`
around:

```js
import { getRequestId, addLogContext } from '@averoa/utilities';

getRequestId();                       // '4b0d6c1e-8a5f-4c39-9d0e-2f1c7a1b9e55'
addLogContext({ userId: req.user.id }); // added to every later log line of this request
```

### Logging

`Log` from `@averoa/utilities` writes structured lines. Every line has `timestamp`, `level` and `message`, plus
`requestId` during a request and the meta fields you pass:

```js
import { Log } from '@averoa/utilities';

Log.info('order placed', { orderId: 42, card: { token: 'tok_123' } });
```

```json
{"card":{"token":"[REDACTED]"},"level":"info","message":"order placed","orderId":42,"requestId":"4b0d6c1e-8a5f-4c39-9d0e-2f1c7a1b9e55","timestamp":"2026-11-16T09:30:00.000Z"}
```

- **Format.** `LOG_FORMAT=json` (default unless `NODE_ENV` is `development` or `test`) or `pretty` (a readable line
  with the request id, the default for local work). Files are always JSON lines.
- **Destination.** `LOG_CHANNEL=stdout` (containers: nothing is written to disk), `file` or `both`. Unset keeps the
  files in `storages/logs` plus the console outside production.
- **Redaction.** Values of keys such as `authorization`, `cookie`, `password`, `secret`, `token`, `apiKey`, `_csrf`
  are logged as `[REDACTED]` at any depth, and `Bearer` / `Basic` credentials inside strings are masked. Add keys
  with `LOG_REDACT=ssn,iban`. Redaction does not see secrets interpolated into free text, so pass data as meta.

The HTTP access log follows `LOG_CHANNEL` too. `ACCESS_LOG_FORMAT=json` (the default on stdout in production) writes
one JSON line per request with `requestId`, `method`, `path` (without the query string), `status`, `durationMs`, `ip`
(the client address from `X-Forwarded-For` only when `TRUST_PROXY` is set) and `userAgent`. Files keep the Apache
`combined` format unless `ACCESS_LOG_FORMAT=json`. Health probes are not logged.

Recommended for containers:

```dotenv
NODE_ENV=production
LOG_CHANNEL=stdout
LOG_FORMAT=json
```

### Health checks

| Endpoint | Purpose | Answer |
| --- | --- | --- |
| `GET /health` | liveness: is the process alive? | always `200 {"status":"ok"}`; checks nothing, so a database outage does not restart the container |
| `GET /ready` | readiness: can it take traffic? | `200` when every check passes, `503` with the status of each check otherwise, and `503 {"status":"shutting_down"}` during a graceful shutdown |

```bash
curl -s localhost:8888/ready
# {"status":"ok","checks":{"database":{"status":"up","durationMs":1.2}}}
# database down: HTTP 503
# {"status":"error","checks":{"database":{"status":"down","durationMs":2001.3,"error":"timeout"}}}
```

`/ready` runs `select 1` on the database with a `READY_TIMEOUT` (2000 ms) limit; `READY_CHECKS=database,queue` also
checks the RabbitMQ connection. Error details are only shown when `NODE_ENV` is `development` or `test`; otherwise
`error` is `timeout` or `failed` and the details go to the log. Add your own checks in `AppProvider.health()`:

```js
// app/Providers/AppProvider.js
health(checks) {
  return {
    ...checks,                                                // keep the database check
    redis: () => redisClient.ping(),                          // down → /ready answers 503
    search: { check: () => pingSearch(), critical: false },   // reported, never fails readiness
  };
}
```

A check fails when it throws, rejects, takes longer than its timeout or returns `false`. Return `false` from
`health()` to disable both endpoints, or move them with `HEALTH_PATH` / `READY_PATH` (`off` disables one).

The probes answer before `AppProvider.beginning()`, sessions, CSRF and the access log: they never set a cookie, need
no CSRF token and are not rate limited or authenticated by middleware you add in `beginning()` or in your routes.

**Graceful shutdown.** On `SIGTERM` `/ready` switches to `503` immediately while `/health` stays `200`. With
`SHUTDOWN_DELAY=5000` the app keeps serving for 5 seconds so the load balancer stops sending traffic, then closes the
server, runs `AppProvider.shutdown()` and closes the database, queue and Redis connections within `SHUTDOWN_TIMEOUT`.

**Docker.** Run `node server.js` directly (not through `npm`) so the process receives `SIGTERM`, and probe with Node
itself (no `curl` needed in slim images):

```dockerfile
ENV NODE_ENV=production LOG_CHANNEL=stdout LOG_FORMAT=json APP_PORT=8888
CMD ["node", "server.js"]
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.APP_PORT||3000)+'/ready').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
```

Docker and Compose have a single health status, so the example probes `/ready`; use `/health` instead if a database
outage should not mark the container unhealthy.

**Kubernetes.**

```yaml
spec:
  terminationGracePeriodSeconds: 30        # > SHUTDOWN_DELAY + SHUTDOWN_TIMEOUT
  containers:
    - name: app
      image: registry.example.com/averoa-app:latest
      ports:
        - containerPort: 8888
      env:
        - { name: NODE_ENV, value: production }
        - { name: LOG_CHANNEL, value: stdout }
        - { name: LOG_FORMAT, value: json }
        - { name: TRUST_PROXY, value: "1" }
        - { name: SHUTDOWN_DELAY, value: "5000" }
        - { name: SHUTDOWN_TIMEOUT, value: "15000" }
      startupProbe:
        httpGet: { path: /health, port: 8888 }
        periodSeconds: 2
        failureThreshold: 30
      livenessProbe:
        httpGet: { path: /health, port: 8888 }
        periodSeconds: 10
        timeoutSeconds: 2
        failureThreshold: 3
      readinessProbe:
        httpGet: { path: /ready, port: 8888 }
        periodSeconds: 5
        timeoutSeconds: 3          # > READY_TIMEOUT
        failureThreshold: 2
```

## Docker and deployment

### Local development with Compose

`compose.yaml` starts the application with its services:

| Service | Image | Host port (`127.0.0.1`) | Purpose |
| --- | --- | --- | --- |
| `app` | `Dockerfile`, `development` target | `FORWARD_APP_PORT` (8888) → `APP_PORT` | `npm run dev` (nodemon) with the project folder mounted at `/app` |
| `mysql` | `mysql:8.4.11` | `FORWARD_DB_PORT` (3306) | database `DB_NAME`, user `DB_USER` / `DB_PASS` (default `averoa` / `averoa`) |
| `rabbitmq` | `rabbitmq:4.3.7-management-alpine` | `FORWARD_RABBITMQ_PORT` (5672), `FORWARD_RABBITMQ_DASHBOARD_PORT` (15672) | queues; management UI at <http://localhost:15672> (`RABBITMQ_USER` / `RABBITMQ_PASS`, default `averoa` / `averoa`) |
| `redis` | `redis:7.4.12-alpine` | `FORWARD_REDIS_PORT` (6379) | available to the app as `REDIS_URL=redis://redis:6379` |
| `minio` | `pgsty/minio` | `FORWARD_MINIO_PORT` (9000), `FORWARD_MINIO_CONSOLE_PORT` (9001) | S3-compatible storage for `UPLOAD_DRIVER=s3` (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`) |
| `minio-setup` | `pgsty/minio` | none | one-shot: creates the `S3_BUCKET` bucket (default `averoa`) and makes it publicly readable |
| `mailpit` | `axllent/mailpit` | `FORWARD_MAILPIT_PORT` (1025), `FORWARD_MAILPIT_DASHBOARD_PORT` (8025) | catches every mail the app sends; inbox at <http://localhost:8025> |
| `mail-worker` | same as `app` | none | `node workers/mail.js`; only with `--profile workers` |

The containers read `.env` and override the host names in it, so `DB_HOST`, `RABBITMQ_SERVER`, `MAIL_HOST` and the
`S3_*` variables point at the services above. The official `minio/minio` images are no longer published; `pgsty/minio`
is a maintained build of the same server.

```bash
cp .env.example .env
# set TOKEN_SECRET in .env (npm run generate:token, or openssl rand -hex 64)
docker compose up --build -d          # builds the image and waits for MySQL, RabbitMQ, Redis and MinIO
docker compose run --rm app npm run migrate:up
docker compose run --rm app npm run seed:run    # development data only
curl http://localhost:8888/api
```

| Task | Command |
| --- | --- |
| Logs | `docker compose logs -f app` |
| Any npm script in the container | `docker compose run --rm app npm run <script>` |
| Generate a secret without Node.js on the host | `docker compose run --rm --no-deps app npm run -s generate:token` |
| Start the mail worker too | `docker compose --profile workers up -d` |
| Store uploads in MinIO | set `UPLOAD_DRIVER=s3` in `.env`, then `docker compose up -d` |
| Rebuild after changing `package.json` | `docker compose up --build -d --renew-anon-volumes` |
| Stop | `docker compose down` (add `-v` to delete the MySQL, RabbitMQ, Redis and MinIO volumes) |

The project folder is mounted into the container, so nodemon restarts the app when you edit a file; `node_modules`
stays the one built into the image (Linux binaries). Ports bind to `127.0.0.1` only; change a `FORWARD_*_PORT`
variable in `.env` when one is already in use on your machine. The credentials in `compose.yaml` are local
development defaults; don't reuse the file for a server.

### Production image

The `Dockerfile`'s last stage is the production image:

```bash
docker build -t averoajs .
docker run -d --name averoajs -p 3000:3000 -e APP_PORT=3000 \
  -e TOKEN_SECRET=... -e SESSION_SECRET=... \
  -e DB_HOST=... -e DB_USER=... -e DB_PASS=... -e DB_NAME=... \
  -v averoajs-uploads:/app/storages/upload \
  -v averoajs-logs:/app/storages/logs \
  averoajs
docker run --rm --env-file .env.production averoajs npm run migrate:up   # as a release step
# an env file copied from .env.example sets APP_PORT=8888: map -p 3000:8888 then, or set APP_PORT=3000 in it
```

- Multi-stage build on `node:22.23.4-alpine3.23` (exact tag; override with `--build-arg NODE_IMAGE=...`, for example
  to pin a digest). Production dependencies only (`npm ci --omit=dev`), `NODE_ENV=production`.
- Runs as the unprivileged `node` user. Application files belong to root; only `storages/` is writable.
- Listens on `APP_PORT` (default `3000`). A `HEALTHCHECK` requests the readiness probe from `@averoa/core` (`GET /ready`, or `READY_PATH`)
  on that port, so the container is unhealthy while the database or another readiness check fails.
- `CMD ["node", "server.js"]` runs Node.js directly, so `SIGTERM` reaches the app's graceful shutdown.
- `.env` is never copied into the image (`.dockerignore`); pass settings as environment variables or secrets.
- The image sets `LOG_CHANNEL=stdout` and `LOG_FORMAT=json`: the application and access logs are JSON lines on stdout
  for the platform's log collector, and nothing is written to `storages/logs` (the volume above is only needed with
  `LOG_CHANNEL=file` or `both`).
- `npm run seed:run` does not work in this image: the seeders need `@faker-js/faker`, a devDependency. Seed from the
  development image instead, and never against production data.
- `@aws-sdk/client-s3` (an optional dependency) is included, so `UPLOAD_DRIVER=s3` works without a rebuild.

## Testing and linting

Tests use the Node.js test runner with no extra framework:

```bash
npm test
```

| File | Covers |
| --- | --- |
| `tests/app.test.js` | Boots the real app with `testApp()` on in-memory SQLite (`better-sqlite3`), runs the migrations and seeders, and tests the sample routes, CSRF, the JWT flow and the Teacher CRUD over HTTP, including `401` for writes without a token |
| `tests/openapi.test.js` | `/api/openapi.json` lists the Teacher CRUD (model schema, filters, bearer auth on writes) and the auth endpoints, hidden columns stay out of the schemas, and `validate()` rejects bad login bodies with `422` |
| `tests/rate-limit.test.js` | The login limiter (`429` after 5 failures per IP and email, separate counters per account and IP, case-insensitive emails, successes not counted, the per-IP limit) and the global `/api` limiter headers |
| `tests/observability.test.js` | `/health` and `/ready` on the real app, the `X-Request-Id` header, `requestId` in error responses, and the `AppProvider.health()` hook |
| `tests/jobs.test.js` | `SendWelcomeEmailJob` and `PruneSoftDeletedJob` with `dispatchSync()` on SQLite, job discovery and the `app/Console/Kernel.js` schedule. With `RABBITMQ_TEST_SERVER` set (for example `amqp://guest:guest@127.0.0.1:5672`), it also runs `workers/jobs.js`, `workers/scheduler.js` and `workers/retry-failed-jobs.js` against that RabbitMQ; otherwise that part is skipped |
| `tests/auth.test.js` | Registration, login, refresh token rotation and reuse detection, logout, password reset, email verification, rate limits and the `TeacherPolicy` authorization over HTTP, with mail recorded by `fakeMail()` |
| `tests/auth-unit.test.js` | `TokenHelper` and `EnsureEmailVerified` |
| `tests/unit.test.js` | `PasswordHelper`, `UploadProvider` path sanitising (in a temporary app root), `UploadImageMiddleware` (`req.file`, `req.dataFiles` for `upload` columns, `422` / `400` errors) and the `TOKEN_SECRET` check |
| `tests/upload-s3.test.js` | `UPLOAD_DRIVER` selection and the `s3` driver against a mocked SDK: keys, client settings, `Content-Type` / `Content-Disposition`, replacing and removing objects, `url()`, configuration errors and the missing-SDK error |
| `tests/upload-s3-minio.test.js` | The `s3` driver against a real MinIO server. Skipped unless `S3_TEST_ENDPOINT` is set (see below) |
| `tests/helpers.js` | `setTestEnv()`: sets `NODE_ENV=test`, the test database and random secrets |

### Writing an HTTP test

`node averoa make:test posts --http` writes the starting point. `testApp()` from `@averoa/core/testing.js` builds the
app, migrates and seeds the test database and listens on a random port. `app.http()` sends requests and resolves
`{ status, headers, body, text }`, and `fakeMail()` records mail instead of sending it:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { testApp, fakeMail } from '@averoa/core/testing.js';
import { setTestEnv } from './helpers.js';

setTestEnv(); // before the app is built

let app;
before(async () => { app = await testApp(); });
after(() => app?.close());

test('login answers a token pair', async () => {
  const res = await app.http('POST', '/api/auth/login', { body: { email: 'demo@averoa.test', password: 'password' } });
  assert.equal(res.status, 200, res.text);
  const me = await app.http('GET', '/api/auth/me', { token: res.body.data.token });
  assert.equal(me.body.data.email, 'demo@averoa.test');
});
```

`app.DB` is the knex instance, for checking rows. On MySQL or PostgreSQL (`AVEROA_TEST_DB_URL`) `testApp()` rolls
every migration back before migrating, and it refuses to do that unless `NODE_ENV=test`. Jobs: `fakeJobs()` (see
[Testing jobs](#testing-jobs)). The full API is in the `@averoa/core` README under "Testing".

### Running the tests

`npm test` runs `scripts/run-tests.mjs`, which passes every `tests/*.test.js` file to `node --test`. The script lists
the files itself because Windows shells and Node.js 20 do not expand the pattern, so `npm test` works the same on
Windows, macOS and Linux and on every supported Node.js version. Options and file names are passed on:

```bash
npm test -- --test-name-pattern=UploadProvider
npm test -- tests/unit.test.js
```

No database server is needed. To run the S3 integration test, start MinIO and point the test at it:

```bash
docker run -d --rm --name averoa-minio -p 127.0.0.1:9000:9000 \
  -e MINIO_ROOT_USER=averoa -e MINIO_ROOT_PASSWORD=averoa-secret \
  pgsty/minio:RELEASE.2026-08-04T00-00-00Z server /data
S3_TEST_ENDPOINT=http://127.0.0.1:9000 S3_TEST_ACCESS_KEY_ID=averoa \
  S3_TEST_SECRET_ACCESS_KEY=averoa-secret npm test
docker stop averoa-minio
```

The bucket (`S3_TEST_BUCKET`, default `averoa-test`) is created when it does not exist.

The rate limiters and sessions use memory in the tests. To run the same suite against Redis, install the optional
packages and point the stores at it, with a fresh prefix so counters from a previous run don't interfere:

```bash
npm install --no-save redis connect-redis rate-limit-redis
SESSION_STORE=redis REDIS_URL=redis://127.0.0.1:6379 \
  SESSION_REDIS_PREFIX=test-$RANDOM:sess: RATE_LIMIT_REDIS_PREFIX=test-$RANDOM:rl: npm test
```


To run the suite against MySQL or PostgreSQL instead of in-memory SQLite, set `AVEROA_TEST_DB_URL` (PostgreSQL also
needs `npm install --no-save pg`). Every test file rolls back the migrations first, so use a throwaway database; with
`AVEROA_TEST_DB_URL` set, `npm test` runs the files one at a time because they share it (`tests/jobs.test.js` keeps
its own SQLite file):

```bash
AVEROA_TEST_DB_URL=mysql://user:pass@127.0.0.1:3306/averoa_test npm test
AVEROA_TEST_DB_URL=postgres://user:pass@127.0.0.1:5432/averoa_test npm test
```

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint` and `npm test` on Node.js 20, 22 and 24,
and `npm test` against MySQL 8.4 and PostgreSQL 17 service containers. It installs the published `@averoa/*`
packages from `package-lock.json`.

Lint with ESLint 10 (flat config in `eslint.config.js`):

```bash
npm run lint
npm run lint:fix   # apply automatic fixes
```

## Upgrading from 1.x

### 2.2.0

Uses `@averoa/core` 2.1.0, `@averoa/routes` 3.1.0 and `@averoa/utilities` 2.1.0 (Redis session store, rate
limiting, request ids, health probes, OpenAPI).

- **Rate limiting.** `/api` is limited to 100 requests per minute per client IP by default (`RATE_LIMIT_*`). Raise
  `RATE_LIMIT_MAX`, return options from `AppProvider.rateLimit()`, or set `RATE_LIMIT_ENABLED=false` if your clients
  need more. Check `TRUST_PROXY` behind a proxy.
- **Login brute-force protection.** `POST /api/auth/login` answers `429` after 5 failed attempts per IP and email (or
  50 per IP) in 15 minutes (`LOGIN_RATE_LIMIT_*`, `app/Middleware/LoginRateLimitMiddleware.js`).
- **Redis sessions without code.** `SESSION_STORE=redis` and `REDIS_URL` replace a hand-written `store` in
  `AppProvider.session()` (which still wins when present). Install `redis connect-redis rate-limit-redis`.
- **`.env.example`** has the new `SESSION_*`, `REDIS_*`, `RATE_LIMIT_*` and `LOGIN_RATE_LIMIT_*` variables.

### 2.2.0: authentication

Changes that affect existing applications and their clients:

- **Everyone logs in again.** Access tokens now carry a token version and a session id; tokens issued by 2.1.0 are
  rejected with `401`.
- **Token response.** Login also returns `refresh_token` and `refresh_expires_in`; `expires_in` is a number of seconds
  instead of the `TOKEN_EXPIRES_IN` string. Without `JWT_ACCESS_TTL` / `TOKEN_EXPIRES_IN`, access tokens last 15
  minutes instead of 1 hour.
- **`TOKEN_EXPIRES_IN` format.** Only seconds (`900`) or a number with a unit (`15m`, `7d`); jsonwebtoken strings such
  as `1 day` or `1.5h` stop the app at startup.
- **Migrations.** `npm run migrate:up` adds `users.email_verified_at`, `token_version`, `is_admin`, the
  `refresh_tokens` and `user_tokens` tables, and a unique index on `users.email`; that migration stops with a list of
  the addresses to fix when two users share one. Users without a password hash can no longer log in.
- **`POST /api/users`** is for verified admins only (`403` for everyone else).
- **Mail sender.** New `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` set the sender of every email the app sends.

### 2.2.0: jobs and scheduling

Uses `@averoa/utilities` 2.1.0 (the `Job`, `startJobWorker` and `Schedule` exports) and `@averoa/core` 2.1.0
(`make:job` generates a `Job` subclass). Changes that affect existing applications:

- **Background jobs and a scheduler.** `npm run worker:jobs`, `npm run schedule:run` and `npm run queue:retry`
  (`workers/`), the schedule in `app/Console/Kernel.js`, and the sample jobs `SendWelcomeEmailJob` and
  `PruneSoftDeletedJob`. See [Jobs and scheduling](#jobs-and-scheduling).
- **`app/Jobs/ExampleJob.js` is gone.** Remove its import if your code used it.
- **`make:job`** generates a class extending `Job` (exported as the class) instead of an instance with `sample()`.
- **New dependency** `croner` and new env vars `JOBS_QUEUE`, `JOBS_WORKER_QUEUES`, `JOBS_CONCURRENCY`,
  `SCHEDULE_TIMEZONE` and `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` (see `.env.example`).

### What's new in 2.1.0

2.1.0 requires `@averoa/core` ^2.0.1, `@averoa/utilities` ^2.0.2 and `@averoa/routes` ^3.0.1. Changes that affect
existing applications:

- **Sample routes need a JWT.** `POST /api/users` and `POST` / `PUT` / `DELETE /api/teachers` answer `401` without a
  valid token; the Teacher reads stay public. `GET /users` only receives first names.
- **Status codes from `Crud`.** `TeacherController` responds with `result.statusCode` (`400` invalid filter, `404`
  unknown id, `422` model validation, `500` database error) instead of `400` for every `Crud` failure.
- **`SESSION_SECRET`** is required unless `NODE_ENV` is `development` or `test` (it was only required in production),
  and stack traces are only shown in `development` and `test`.
- **ESM templates for `migrate:make` and `seed:make`** in `database/stubs`; generated files run without changes.
- **`npm run worker:mail`** starts the mail worker (`workers/mail.js`).
- **`UploadImageMiddleware`** also sets `req.files`, so it feeds `upload` columns on `crud()` routes, and answers `400`
  for a malformed multipart body.
- **Configuration.** `config/fetch.js` reads `FETCH_BASE_URL` and `FETCH_TIMEOUT` (default 10 s) and no longer limits
  bodies to 2000 bytes; `config/mail.js` reads `MAIL_SECURE`; relative SQLite paths are resolved against the
  application root. In `.env.example`, `CORS_WHITELIST` is empty and `MAIL_DRIVER` is gone.
- **Node.js** `^20.19.0 || ^22.13.0 || >=24`.

### From 1.x to 2.0

Version 2 is a breaking release of the boilerplate and of every framework package. The main changes:

- **Runtime.** Node.js 20.19 or newer (22.13 or newer on 22.x), ESM only, Express 5, Knex 3, multer 2, passport 0.7, jsonwebtoken 9.
- **Packages.** `@averoa/core` ^2, `@averoa/utilities` ^2, `@averoa/routes` ^3. The re-export packages
  `@averoa/models`, `@averoa/providers`, `@averoa/repositories`, `@averoa/helpers` and `@averoa/jobs` are no longer
  used: replace their imports with `#models`, `#providers`, `#repositories`, `#helpers` and `#jobs`, and copy the
  `imports` block of `package.json`.
- **Secrets.** `TOKEN_SECRET` is required at startup and `SESSION_SECRET` outside development and test. The 1.x
  `.env.example` contained a concrete `TOKEN_SECRET`; if you kept it, replace it.
- **Authentication.** `AuthMiddleware` now authenticates and answers `401` JSON (in 1.x every route behind it hung).
  `LocalStrategy` checks the real password (1.x accepted any credentials). Run `npm run migrate:up` to add the
  `users.password` column.
- **Status codes.** Validation failures answer `422` and unknown ids `404` instead of `200` with `status: false`.
- **Security defaults.** CSRF is on for web routes and for session-authenticated `/api` requests; add `_csrf` to forms
  or set `CSRF_ENABLED=false`. The CSP allows only local scripts. CORS without a whitelist no longer sends credentials
  outside development.
- **Models and filters.** Hidden columns, strict filters, `$select` / `$relations` validation, enforced soft delete,
  and `limit` capped at 1000.
- **Express 5.** `req.query` is read-only; wildcards must be named (`/*splat`).
- **Seeders.** `@faker-js/faker` 10 is a devDependency of the app: use `f.person.firstName()`,
  `f.location.streetAddress()`, `f.number.int({ min, max })`.
- **CLI.** `make:crud -init` is now `--init`, and `--force` is needed to overwrite files.
- **Tests.** jest was replaced by `node --test`; ESLint 8 (airbnb) by ESLint 10 with a flat config.

<details>
<summary>Dependencies removed from the application</summary>

`helmet`, `express-handlebars`, `mysql`, `passport-google-oauth`, `passport-google-oauth20`, `passport-http-bearer`,
`glob`, `crypto`, `csurf`, `moment`, `axios`, `chalk`, `commander`, `cookie-parser`, `cors`, `express-session`,
`morgan`, `validator`, `winston`, `amqplib`, `nodemailer` and `jest` are no longer dependencies of the app. They are
either unused or now provided by `@averoa/core` / `@averoa/utilities`. Install any of them again if your own code
imports them directly.

New `.env` variables: `TOKEN_EXPIRES_IN`, `SESSION_SECRET`, `CSRF_ENABLED`, `BODY_LIMIT`, `LOG_LEVEL`,
`UPLOAD_MAX_FILE_SIZE`, `TRUST_PROXY`, `SHUTDOWN_TIMEOUT`, `AVEROA_ROOT`, `MAIL_QUEUE`. `MAIL_USERNAME=null` is no
longer needed; leave it empty.

</details>

The complete list of breaking changes is in each package's changelog:
[@averoa/core](https://github.com/budiherma1/AveroaCore/blob/main/CHANGELOG.md) ·
[@averoa/routes](https://github.com/budiherma1/AveroaRoute/blob/main/CHANGELOG.md) ·
[@averoa/utilities](https://github.com/budiherma1/AveroaUtilities/blob/main/CHANGELOG.md).

## Ecosystem

| Package | Version | Description | Links |
| --- | --- | --- | --- |
| averoajs | 2.2.2 | This application boilerplate (not published to npm) | [GitHub](https://github.com/budiherma1/averoajs) |
| `@averoa/core` | 2.1.1 | Builds the Express app (security, sessions, CSRF, CORS, views, routes, errors, shutdown), the knexfile and the `averoa` CLI | [GitHub](https://github.com/budiherma1/AveroaCore) · [npm](https://www.npmjs.com/package/@averoa/core) |
| `@averoa/routes` | 3.1.0 | Laravel-style router: `'Controller@method'`, scopes, `*Form` routes, `crud()` hooks | [GitHub](https://github.com/budiherma1/AveroaRoute) · [npm](https://www.npmjs.com/package/@averoa/routes) |
| `@averoa/utilities` | 2.1.1 | Model, Crud, FilterSearch, DB, Mail, Queue, mail worker, View, Log, Fetch, Validator | [GitHub](https://github.com/budiherma1/AveroaUtilities) · [npm](https://www.npmjs.com/package/@averoa/utilities) |
| `@averoa/models`, `providers`, `repositories`, `helpers`, `jobs` | 1.0.3 | 1.x re-export packages, superseded by the `#` subpath imports | [models](https://www.npmjs.com/package/@averoa/models) · [providers](https://www.npmjs.com/package/@averoa/providers) · [repositories](https://www.npmjs.com/package/@averoa/repositories) · [helpers](https://www.npmjs.com/package/@averoa/helpers) · [jobs](https://www.npmjs.com/package/@averoa/jobs) |

## Troubleshooting

**`TOKEN_SECRET is not set` at startup.** `JwtStrategy` requires it. Run `npm run generate:token` and put the value in
`.env`.

**`SESSION_SECRET is required unless NODE_ENV is development or test`.** Set `SESSION_SECRET`, or `NODE_ENV=development`
for local work. In development and test a random secret is generated on every start, so sessions do not survive a
restart.

**`403 Invalid or missing CSRF token` when submitting a form.** Add
`<input type="hidden" name="_csrf" value="{{ csrfToken }}">` to the form. For multipart forms and AJAX requests, send
the token in the `x-csrf-token` header. After a session login, fetch the token again, because the session was
regenerated.

**Cross-origin requests get `403`.** A non-empty `CORS_WHITELIST` is enforced in every environment. Add your front
end's origin, or leave it empty for local work.

**`429 Too many login attempts` while testing locally.** The login limiter counts failed attempts per IP and email
for 15 minutes. Wait for the window (`Retry-After` gives the seconds), restart the application (memory store), or
raise `LOGIN_RATE_LIMIT_MAX` in development.

**Every client gets `429` at the same time behind a proxy.** `TRUST_PROXY` is not set, so all requests seem to come
from the proxy's IP. Set it to the number of proxies in front of the application (usually `1`).

**`... but Redis at redis://... is not reachable within 5000ms ... Refusing to start`.** A Redis store is selected
(`SESSION_STORE=redis` or `RATE_LIMIT_STORE=redis`) and Redis cannot be reached. Start Redis, fix `REDIS_URL`, or
raise `REDIS_CONNECT_TIMEOUT`. `... needs the optional package "connect-redis"` means the package is not installed:
run the `npm install` it shows.

**A filter seems to have no effect.** Bare `column=value` keys for unknown or hidden columns, and `relation.column`
keys without `$relations-type=join`, are ignored rather than rejected. Use the operator form (`column:eq=value`) to get
an error for unknown columns.

**`config/database.js` imports `@averoa/utilities` and the database is not ready.** Config files that import the root
package are loaded lazily, with a warning, because a top-level import cycle would otherwise block startup. Import from
`@averoa/utilities/paths` in config files, or `await getDB()` before the first query.

**`401 Unauthorized` from `POST /api/users` or a Teacher write.** These sample routes are behind `AuthMiddleware`. Log
in with `POST /api/auth/login` and send `Authorization: Bearer <token>`. `POST /api/users` then answers `403` unless the
user is an admin with a verified email (the seeded `demo@averoa.test` is).

**Dispatched jobs never run.** Start `npm run worker:jobs` with the same `RABBITMQ_SERVER` and `JOBS_QUEUE` as the
web server. A job on a queue the worker does not consume (`static queue`, `JOBS_WORKER_QUEUES`) waits there.

**`unknown job "..."` in the worker log.** The message names a job that the worker's `app/Jobs/index.js` does not
export, usually a worker running older code than the dispatcher. The message is kept in `<queue>.failed`; deploy the
worker and run `npm run queue:retry`.

**Scheduled tasks run twice.** More than one `npm run schedule:run` (or a long-running scheduler and a `--once` cron)
is running. Keep exactly one.

## Contributing

Issues and pull requests are welcome at [github.com/budiherma1/averoajs](https://github.com/budiherma1/averoajs).
Before opening a pull request, run:

```bash
npm run lint
npm test
```

Changes to the framework itself (bootstrap, router, models, filters, CLI) belong in the package repositories listed in
[Ecosystem](#ecosystem). To test the application against local checkouts of those packages:

```bash
# expects ../dependencies/{AveroaUtilities,AveroaRoute,AveroaCore}; pass another folder as an argument
# or set AVEROA_DEPS_DIR
npm run link:local
npm test
```

`link:local` packs each package with `npm pack`, installs the tarballs without changing `package.json` or
`package-lock.json`, and unpacks them into `node_modules/@averoa/*`. Run it again after every `npm install`, which
restores the registry versions.

## License

[MIT](LICENSE) © Budi Hermawan ([@budiherma1](https://github.com/budiherma1))
