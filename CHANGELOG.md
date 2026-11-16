# Changelog

## 2.5.0

### Added

- **Starters** for `npm create averoa` (create-averoa 1.1.0 and later, `--starter <name>` or the prompt):
  - `minimal`: authentication, users and the framework setup without the example models, routes, views and tests.
  - `dashboard`: `minimal` plus server-rendered admin pages with a session login (CSRF, login rate limit), an
    overview with user numbers, a searchable users list for admins, profile and password pages, and their tests.

  They live in `starters/` (see `starters/README.md`); a new CI job creates an app from each one and runs its tests,
  lint and generators.

### Changed

- The `/api/auth/*` routes moved from `routes/api.js` to `routes/auth.js`, which `routes/api.js` mounts with
  `auth(router)`. The routes themselves are unchanged.
- The example tests (sample routes, Teacher CRUD, `EnsureEmailVerified` on `POST /api/teachers`, `TeacherPolicy`,
  the Teacher OpenAPI document) moved to `tests/examples.test.js`; the `PruneSoftDeletedJob` tests use `users`.
- `GET /api` answers `{ name }` without the out-of-date `version`.
- Comments and stubs that pointed at the Teacher example now use a generic `Post` example.

## 2.4.0

### Changed

- Uses `@averoa/core` 2.3.1. The HTTP tests start the app with `testApp()` from `@averoa/core/testing.js` instead of
  repeating the build / migrate / seed / listen / close steps in every file, and `tests/auth.test.js` records mail
  with `fakeMail()`. The README has a "Writing an HTTP test" section; `make:test --http` generates the same setup.
- `tests/helpers.js` no longer has `client()`: use `app.http()` from `testApp()`, or `client()` from
  `@averoa/core/testing.js`.

## 2.3.0

### Added

- Uses `@averoa/core` 2.2.0 and its new generators: `make:policy`, `make:validator`, `make:migration`
  (`--create` / `--table`), `make:test` (`--http`) and `make:model --migration --seed`. The README's "CLI generators"
  section has a walkthrough for a new resource.

### Fixed

- Generated files end with a newline, so `npm run lint` passes on them as generated.

## 2.2.2

### Changed

- Uses `@averoa/utilities` 2.1.1 and `@averoa/core` 2.1.1: `Model.search()` keeps the query's other conditions, job
  workers hand unknown jobs to newer workers during rolling deploys, array route ids are answered 404.
- **`TRUST_REQUEST_ID`**: an incoming `X-Request-Id` is reused only with `TRUST_REQUEST_ID=true` (`TRUST_PROXY` alone
  no longer trusts it). `.env.example`, the configuration table and the production checklist say so.

## 2.2.1

### Fixed

- The test suite passes in a project created by create-averoa: it no longer reads `JWT_ACCESS_TTL` /
  `JWT_REFRESH_TTL` from the project's `.env`, and the OpenAPI test compares with the project's own version.

## 2.2.0

### Added

- **S3 uploads.** `UPLOAD_DRIVER=s3` stores uploads in AWS S3 or an S3-compatible service (MinIO, R2, Spaces, ...)
  through `@aws-sdk/client-s3`, an optional dependency loaded on first use (clear error when missing). Settings:
  `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
  `S3_PUBLIC_URL`. Objects use the same sanitised `<route>/<uuid>-<name>` key the local driver stores, which is what
  `UploadProvider.upload()` returns and `Crud` saves. `Content-Type` comes from the extension; files outside the
  inline allowlist get `Content-Disposition: attachment`, like `/upload`. Replacing a file deletes the old object.
- **`UploadProvider.url(name)`** builds the public URL of a stored name for either driver, and `remove()` follows
  `UPLOAD_DRIVER`. An unknown `UPLOAD_DRIVER` is an error.
- **Docker.** A multi-stage `Dockerfile` (production image on `node:22.23.4-alpine3.23`, non-root, `npm ci
  --omit=dev`, `HEALTHCHECK` on `/ready`) with a `development` target, `.dockerignore`, and `compose.yaml` for local development:
  the app with MySQL 8.4, RabbitMQ (management UI), Redis, MinIO and Mailpit, plus an optional mail worker
  (`--profile workers`).

### Changed

- **`npm test` works on Windows.** It runs `scripts/run-tests.mjs`, which lists `tests/*.test.js` itself instead of
  relying on shell glob expansion (cmd.exe and Node.js 20 don't expand it). Extra arguments are passed to
  `node --test`.
- **No lint warnings.** The sample helper, job and repository log through `Log`; the CLI scripts and the startup
  error in `server.js` keep `console` with an explanatory `eslint-disable` comment.
- `@aws-sdk/client-s3` is an `optionalDependency`: installed by `npm ci` and `npm ci --omit=dev`, left out with
  `--omit=optional`.
