# Starters

A starter is a variant of this boilerplate that `npm create averoa` can create instead of the full repository:

```bash
npm create averoa@latest my-app -- --starter dashboard
```

| Starter | Extends | What it changes |
| --- | --- | --- |
| `minimal` | | Removes the examples (Teacher and Rooms models, migrations and seeders, `SampleController`, `TeacherController`, `TeacherPolicy`, `routes/v2`, the example views and `tests/examples.test.js`) and replaces the files that referenced them (`routes/api.js`, `routes/web.js`, the model, helper and repository indexes, `AuthProvider`) |
| `dashboard` | `minimal` | Adds server-rendered admin pages with a session login: `routes/web.js`, four controllers, three middleware, the views in `resources/views/{components,auth,dashboard}`, `public/css/dashboard.css` and `tests/dashboard.test.js` |

The starters ship in the same release as the boilerplate, so a starter always matches the framework version it was
written for. create-averoa never copies this folder into an application.

## Layout

```text
starters/<name>/
├── starter.json   the manifest
└── files/         copied over the app: new files are added, files with the same path are replaced
```

`starter.json` (every key is optional):

```json
{
  "description": "One line, shown by the create-averoa prompt",
  "extends": "minimal",
  "remove": ["app/Models/Teacher.js", "routes/v2"],
  "dependencies": { "some-package": "^1.2.0" },
  "devDependencies": {},
  "scripts": { "build:css": "node scripts/build-css.mjs" },
  "env": { "SOME_SETTING": "value" }
}
```

create-averoa applies the `extends` chain first (`minimal`, then `dashboard`). For each starter it removes the
`remove` paths (files or folders), copies `files/`, merges `dependencies`, `devDependencies` and `scripts` into
`package.json` and sets the `env` values in `.env.example`, from which the app's `.env` is written. Paths must be
relative and stay inside the app; unknown keys are an error.

## Writing or changing a starter

- Keep the base app working without the starter: a starter only removes, adds and replaces files.
- A replaced file is a copy. When the base version of that file changes, check whether the starter's copy needs the
  same change (`git grep` the path under `starters/`).
- Tests that need the examples go in `tests/examples.test.js`, so `minimal` can remove them in one line. A starter
  brings tests for what it adds (`tests/dashboard.test.js`).
- `npm run lint` skips `starters/`: the files only resolve inside a generated app.
- Try a starter locally with a create-averoa checkout or the published CLI:

  ```bash
  npx create-averoa /tmp/try-dashboard --template . --starter dashboard --no-git
  cd /tmp/try-dashboard && npm test && npm run lint
  ```

- Add the starter to the `starters` job matrix in `.github/workflows/ci.yml`. CI creates an app from it, runs its tests
  and lint, then runs `make:crud` and `make:test` and both again.
