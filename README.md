# Marketplace Literacy

The application has a React/Vite frontend and a NestJS/PostgreSQL API. Backend controllers, DTOs, and services are grouped by feature module; frontend screens are grouped under `ML-TIH_Frontend/src/modules`.

## Start the development app

From this repository root, run:

```powershell
npm run dev
```

Choose backend, frontend, or both in the interactive menu. Each process prints its status between divider lines. Press Ctrl+C to stop.

To run a service directly:

```powershell
cd ML-TIH-LBackend
npm.cmd run start:dev
```

```powershell
cd ML-TIH_Frontend
npm.cmd run dev
```

## Configuration and checks

- Backend env template: `ML-TIH-LBackend/.env.example`; setup: `ML-TIH-LBackend/README.md`.
- Frontend env template: `ML-TIH_Frontend/.env.example`; setup: `ML-TIH_Frontend/README.md`.
- API readiness: `http://localhost:6062/api/health`; Swagger: `http://localhost:6062/api`.

Run backend checks from `ML-TIH-LBackend` with `npm.cmd test -- --runInBand` and `npm.cmd run build`. Run frontend checks from `ML-TIH_Frontend` with `npm.cmd run lint` and `npm.cmd run build`.
