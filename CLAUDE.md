# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A personal home dashboard (wall-mounted/kiosk style) showing weather and live solar production/battery data from a Sungrow inverter via the iSolarCloud API. pnpm/Turborepo monorepo with an Express backend and a Vite/React frontend.

## Commands

Run from repo root (Turborepo fans these out to each workspace):

```
pnpm install         # install all workspace deps
pnpm dev             # run backend + web in dev mode (turbo dev, persistent)
pnpm build           # build all workspaces (packages/shared first, since apps depend on it)
pnpm lint            # lint all workspaces
pnpm typecheck       # typecheck all workspaces
```

Per-workspace (run inside `apps/backend`, `apps/web`, or `packages/shared`):

```
pnpm dev             # backend: tsx watch src/server.ts | web: vite | shared: tsup --watch
pnpm build           # backend/shared: tsc | web: tsc -b && vite build
pnpm lint            # backend/shared: tsc --noEmit | web: eslint .
pnpm typecheck       # tsc --noEmit (backend/shared) or tsc -b (web)
```

There is no test suite in this repo currently. `lint` for the backend and shared package is just a type check, not a separate linter.

`apps/web` also has `pnpm generate:routes` (runs `tsr generate`) to regenerate `src/routeTree.gen.ts` after adding/renaming files under `src/routes/` — TanStack Router's Vite plugin normally does this automatically in dev/build, so this is mainly useful standalone.

Because `apps/web` and `apps/backend` both depend on `@repo/shared`, changes to `packages/shared` require it to rebuild (`pnpm --filter @repo/shared build`, or run `pnpm dev`/`turbo dev` at the root so tsup watches it) before consuming apps pick up the change — the workspace resolves to `packages/shared/dist`, not the TS source.

## Architecture

**Monorepo layout** (pnpm workspaces + Turborepo, defined in `pnpm-workspace.yaml` / `turbo.json`):
- `apps/backend` — Express API server (TypeScript, ESM, `tsx` for dev, plain `tsc` build).
- `apps/web` — Vite + React 19 SPA, TanStack Router (file-based routing) + TanStack Query, Tailwind v4, shadcn/radix-ui components.
- `packages/shared` — Cross-cutting TS types and constants (`API_ROUTES`, `PRODUCTION_STATUS`, `WEATHER_ICONS`, request/response types) built with `tsup` and consumed by both apps as `@repo/shared`. This is the contract between frontend and backend — when adding an endpoint or changing a payload shape, update this package first.
- `packages/tsconfig` — Shared base `tsconfig.json` presets (`base.json`, `node.json`, `vite.json`) extended by the apps/packages.
- `bin/` — Bash deployment helpers for a Linux target host, not used in local dev: `install-deps.sh` provisions a fresh Debian box (nginx, nvm/node, pnpm, ufw firewall rules), `deploy.sh` does `git reset --hard origin/main` + `pnpm install` + build + copy `apps/web/dist` to a target directory (default `/var/www/html`, nginx's default document root, so the app is served at `/`), served behind nginx. The frontend is a static build; only the backend runs as a long-lived Node process.

**Backend (`apps/backend/src`)**:
- `server.ts` wires up CORS (locked to `FRONTEND_ORIGIN`, credentials enabled), `cookie-parser`, JSON body parsing, a `/health` check, and mounts route modules.
- `routes/*.route.ts` are thin Express routers; they read/write iSolarCloud auth cookies and delegate real work to `lib/*.ts`.
- `lib/weather.ts` wraps the `openmeteo` client (Open-Meteo forecast API), retries transient network errors, and maps Open-Meteo weather codes + day/night (via sunrise/sunset) to the app's `WeatherIcon` set.
- `lib/isolar.ts` is the iSolarCloud integration — read the comments at the top of this file before touching it. Key points:
  - Uses the **User (account/password) API family** (`/login`, `/getPowerStationList`, `/getDeviceList`, `/getDeviceRealTimeData`), which is a different auth model and response shape than iSolarCloud's OAuth2.0 developer-portal API — tokens from one family don't work with the other.
  - The login token, plant ID (`ps_id`), and resolved inverter reference (`ps_key` + `device_type`) are cached in httpOnly cookies (`ISOLAR_TOKEN_COOKIE`, `ISOLAR_PS_ID_COOKIE`, `ISOLAR_INVERTER_PS_KEY_COOKIE`, `ISOLAR_INVERTER_DEVICE_TYPE_COOKIE`) so subsequent requests don't need to re-resolve them.
  - Plain grid-tied inverters and hybrid/ESS (battery) inverters expose different measuring-point IDs for the same physical quantities (e.g. `POINT_LOAD_POWER` vs `POINT_LOAD_POWER_EMS`); code generally requests both and takes the first defined value (`firstDefinedNumber`).
  - Per-string PV power is device-type-dependent too: plain inverters report string power directly, ESS inverters only report MPPT voltage/current and power is computed as `P = V * I`. String labels ("East roof"/"West roof") are hardcoded to this specific installation's physical layout in `PV_STRING_CONFIG_BY_DEVICE_TYPE`.
  - Solar power total prefers summing per-string readings over the plant-level point when available, since the two are separate API calls and can drift slightly out of sync.
- Configuration is via `.env` (see `apps/backend/.env.example`): `FRONTEND_ORIGIN`, `PORT`, `OPENMETEO_URL`, `ISOLAR_CLOUD_URL`, `ISOLAR_CLOUD_APPKEY`, `ISOLAR_SECRET_KEY`.

**Frontend (`apps/web/src`)**:
- Routing is file-based via TanStack Router (`src/routes/*.tsx`); `routeTree.gen.ts` is generated — don't hand-edit it. `__root.tsx` defines the app shell/layout and nests the global context providers.
- Global state is split into small React Context providers composed in `__root.tsx`, each with a colocated `use*` hook that throws if used outside its provider: `SettingsProvider` (theme/language, persisted to `localStorage`), `FullscreenProvider`, `PageRefreshProvider` (lets a route register a manual "refresh" action for the sidebar), `IsolarProvider` (iSolarCloud login/session/solar-data via TanStack Query, cookie-based `credentials: "include"` fetches to the backend).
- `IsolarProvider` exposes `refetchSolarData` but doesn't poll on its own; the home route (`routes/index.tsx`) drives a single 5-minute interval that refreshes both weather and (when logged in) solar data together, so the two never drift out of sync. `IsolarProvider` still invalidates the login-status query on solar-data fetch errors (so an expired iSolarCloud session correctly falls back to the login dialog rather than silently failing).
- The backend base URL is `VITE_BACKEND_URL` (defaults to `http://localhost:4000`); the app talks to it via direct `fetch` calls in the context providers, using route paths from `@repo/shared`'s `API_ROUTES` rather than hardcoded strings.
- UI components under `src/components/ui/` are shadcn/radix-ui primitives (see `components.json` for the shadcn config — style `radix-maia`, no RSC, path aliases `@/components`, `@/lib`, `@/hooks`). `src/lib/mock-data.ts` provides fallback/demo dashboard data (e.g. used before Sungrow login or for local UI work without live credentials).
- Path alias `@/*` maps to `apps/web/src/*` (configured in `vite.config.ts` and the app's `tsconfig`).
