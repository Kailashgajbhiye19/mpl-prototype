# Marketplace Literacy API

NestJS API backed by PostgreSQL. The API listens on port `6062` by default and serves Swagger UI at `/api`.

## Local setup (Windows PowerShell)

1. Install Node.js and PostgreSQL. Set `DB_NAME` to your local database name (the configured development database is `marketplace_literacy`).
2. In this directory, copy `.env.example` to `.env` and set `DB_PASSWORD` and `JWT_SECRET` to local values. Keep `.env` private; it is ignored by Git.
3. Confirm PostgreSQL is accepting connections, create the application database, and enter your PostgreSQL password when prompted:

   ```powershell
   & 'D:\postgresql\bin\pg_isready.exe' -h localhost -p 5432
   & 'D:\postgresql\bin\createdb.exe' -h localhost -p 5432 -U postgres marketplace_literacy
   ```

   If PostgreSQL tools are on your `PATH`, you can use `pg_isready` and `createdb` without the full path. If the database already exists, `createdb` will report that; no need to create it again.

4. Install dependencies and start the API. The development command applies pending versioned migrations before starting:

   ```powershell
   npm.cmd ci
   npm.cmd run start:dev
   ```

   The API should be available at `http://localhost:6062/api`.

For a fresh database with no administrator, temporarily set `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, and a strong `INITIAL_ADMIN_PASSWORD` in the private `.env` file, run `npm.cmd run admin:bootstrap`, then remove those values from `.env`. The command refuses to run if an administrator already exists. If the only administrator is locked out, set `RESET_ADMIN_USERNAME`, `RESET_ADMIN_PASSWORD`, and `CONFIRM_ADMIN_PASSWORD_RESET=true` in `.env`, run `npm.cmd run admin:reset`, then remove the reset values.

5. To connect the frontend, copy `ML-TIH_Frontend/.env.example` to `ML-TIH_Frontend/.env.local` and adjust `VITE_API_URL` if needed:

   ```dotenv
   VITE_API_URL=http://localhost:6062/api
   ```

   Restart Vite after changing its environment file.

## Database schema

The repository-level `ml_latest.sql` is a PostgreSQL custom-format archive from the `tih_project` database and includes database schema and data. Restore it only into a separate, empty database when you intend to use that snapshot; it is not a plain SQL file and must be restored with `pg_restore`:

```powershell
createdb -U postgres marketplace_literacy_restore
pg_restore --no-owner --no-privileges -U postgres -d marketplace_literacy_restore ..\..\ml_latest.sql
```

The application defaults to the `marketplace_literacy` database configured in `.env`; the archive restore command above creates a separate database and does not replace it. For a fresh application database, the versioned schema-only baseline in `migrations/000_initial_schema.sql` creates the application tables, and later files apply incremental changes. `npm.cmd run start:dev` applies pending migrations automatically; you can run `npm.cmd run db:migrate` separately to inspect migration output.

## Verification

Run the unit and HTTP-level checks with `npm.cmd test -- --runInBand` and `npm.cmd run test:e2e -- --runInBand`. To exercise authenticated CRUD, migrations, admin password flows, and reporting against PostgreSQL, run `npm.cmd run test:workflows`. This builds the API, creates a uniquely named disposable database using the configured PostgreSQL credentials, runs the migrations and workflow checks, then drops the test database. The configured database user needs `CREATEDB` permission for this command; application data is not used for test writes.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `marketplace_literacy` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | none | Database password; set in `.env` |
| `PORT` | `6062` | API listen port |
| `API_BASE_URL` | `http://localhost:<PORT>` | Base URL used when creating uploaded file URLs |
| `CORS_ORIGINS` | local Vite origins | Comma-separated list of allowed browser origins |
| `JWT_SECRET` | development-only fallback | Secret used to sign and verify login tokens |

The browser uses JWT authentication after login; do not put shared secrets in Vite variables because browser bundles are public. Set a unique `JWT_SECRET` of at least 32 characters and the externally reachable `API_BASE_URL` origin in production. Production refuses to start generating local-only upload URLs when `API_BASE_URL` is missing or malformed.
