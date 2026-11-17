# Marketplace Literacy frontend

React and Vite admin client for Marketplace Literacy. Feature screens live under `src/modules`; shared components, API clients, and hooks live under `src/components`, `src/services`, and `src/hooks`.

## Local setup

From this directory, create `.env.local` from `.env.example`. Set `VITE_API_URL` to the backend API URL if it differs from the local default. Browser clients authenticate with the JWT issued after login; do not place private shared keys in Vite variables.

```powershell
npm.cmd ci
npm.cmd run dev
```

The API URL defaults to `http://localhost:6062/api`; set `VITE_API_URL` to override it. Restart Vite after environment changes.

## Verification

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Participant imports are available from the Participants screen. CSV files support `training_id` and `name` plus optional `phone`, `age`, `caste`, `education`, `category`, `attendance_status`, and `profile_image_url` columns. Imports accept up to 500 rows and report row-level API failures; each successful row is saved independently.
