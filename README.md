# Home Dashboard

A wall-mounted/kiosk-style home dashboard showing local weather and live solar production/battery data from a Sungrow inverter (via the iSolarCloud API).

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend** (`apps/backend`): Express, TypeScript (ESM), `tsx` for dev
- **Frontend** (`apps/web`): Vite, React 19, TanStack Router + TanStack Query, Tailwind CSS v4, shadcn/radix-ui
- **Shared** (`packages/shared`): TypeScript types and constants shared between backend and frontend, built with `tsup`

## Project structure

```
apps/
  backend/   Express API — weather proxy (Open-Meteo) and iSolarCloud/Sungrow integration
  web/       React SPA — dashboard UI
packages/
  shared/    Shared types, constants, and API route definitions (@repo/shared)
  tsconfig/  Shared base tsconfig presets
bin/
  install-deps.sh   Provisions a fresh Debian host (nginx, node via nvm, pnpm, firewall)
  deploy.sh         Pulls latest main, builds apps/web, copies dist/ to the target host
```

## Getting started

Prerequisites: Node.js (LTS) and pnpm.

```bash
pnpm install
```

Configure the backend by copying the example env file and filling in your iSolarCloud credentials:

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Description |
| --- | --- |
| `FRONTEND_ORIGIN` | Origin allowed by CORS (default `http://localhost:5173`) |
| `PORT` | Backend port (default `4000`) |
| `OPENMETEO_URL` | Open-Meteo forecast API base URL |
| `ISOLAR_CLOUD_URL` | iSolarCloud OpenAPI gateway base URL |
| `ISOLAR_CLOUD_APPKEY` | iSolarCloud app key |
| `ISOLAR_SECRET_KEY` | iSolarCloud access key |

Run both apps in dev mode:

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Common commands

Run from the repo root (Turborepo fans these out to each workspace):

```bash
pnpm dev         # run backend + web in watch mode
pnpm build       # build all workspaces
pnpm lint        # lint all workspaces
pnpm typecheck   # typecheck all workspaces
```

## Deployment

`bin/deploy.sh` builds `apps/web` and copies the static output to a target directory on a server (default `/var/www/html`, i.e. nginx's default document root — the app is served at `/`), intended to run behind nginx. See `bin/install-deps.sh` for initial host provisioning. Run `bin/deploy.sh --help` for available flags.
