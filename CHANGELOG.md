# Changelog

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
