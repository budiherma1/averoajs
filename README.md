
![alt text](https://averoa.com/averoa.png)
# AveroaJS

'Laravel Like' Boilerplate built on express


## Installation

Install averoajs with npm

```bash
  git clone https://github.com/budiherma1/averoajs.git
  cd averoajs
  cp .env.example .env
  npm install
  npm run start:dev
```

## Directory Structure

```bash
  |-- averoaJS
    |-- .env.example
    |-- .gitignore
    |-- averoa.js
    |-- README.md
    |-- package-lock.json
    |-- package.json
    |-- server.js
    |-- app
    |   |-- Console
    |   |   |-- Command
    |   |-- Controllers
    |   |-- Helpers
    |   |-- Jobs
    |   |-- Middleware
    |   |-- Models
    |   |-- Providers
    |   |-- Repositories
    |   |-- Strategies
    |-- config
    |-- database
    |   |-- migrations
    |   |-- seeds
    |-- public
    |-- resources
    |   |-- assets
    |   |   |-- js
    |   |   |   |-- components
    |   |   |-- sass
    |   |-- lang
    |   |-- views
    |-- routes
    |   |-- api.js
    |   |-- web.js
    |-- storages
    |   |-- logs
    |   |   |-- access.log
    |   |   |-- averoa.log
    |   |   |-- error.log
    |   |-- tmp
    |   |-- upload
    |-- tests

```

- Controllers

```bash
  node averoa make:controller NameController
```

- Helpers

```bash
  node averoa make:helper NameHelper
```

- Jobs

```bash
  node averoa make:job NameJob
```

- Middleware

```bash
  node averoa make:middleware NameMiddleware
```

- Models

```bash
  node averoa make:model NameModel
```

- Repositories

```bash
  node averoa make:repository NameRepository
```

- Strategies

```bash
  node averoa make:strategy NameStrategy
```

## Migration and Seeder
Before running migration/seeder command, Please install knex CLI globally
```bash
  sudo npm install knex -g
```


Creating migration file
```bash
  npm run migrate:make migration_name
```

Executing migration
```bash
  npm run migrate:up
```

Taken down migration
```bash
  npm run migrate:down
```

Creating seeder file
```bash
  npm run seed:make seeder_name
```

Executing seeder
```bash
  npm run seed:run
```