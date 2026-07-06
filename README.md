# Home Dashboard

A wall-mounted / kiosk-style home dashboard showing local weather, live solar production & battery data from a Sungrow inverter (via the iSolarCloud API), an AI-generated daily outlook, and a regional news feed.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-Router_%2B_Query-FF4154?logo=reactquery&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-5FA04E?logo=nodedotjs&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2.5-EF4444?logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Dashboard & UI
- 🖥️ **Kiosk-ready home dashboard** with a glassmorphism look — mesh-gradient background and frosted glass cards.
- 🧭 **Multi-page layout** with a collapsible sidebar: Home, Weather, News, and Solar (Live + Statistics).
- 🏠 **Home overview** combining a time-of-day greeting, weather hero, live production status, current conditions, news, animated power flow, and the AI outlook — all on one screen.
- 🌗 **Themes**: light, dark, system, and *auto* (switches between light/day and dark/night by time of day).
- 🌍 **Multi-language UI**: English, German, and Dutch, persisted across sessions (cookie + `localStorage`).
- ⛶ **Fullscreen / kiosk mode** toggle for wall-mounted displays.
- 🔄 **Unified 5-minute auto-refresh** plus a manual refresh control, keeping weather and solar data in sync so they never drift apart.
- 📱 **Responsive** down to mobile, with a slide-in drawer sidebar and graceful loading / empty / error / "outdated data" states throughout.

### Weather (Open-Meteo)
- 🌡️ **Current conditions**: temperature, feels-like, humidity, precipitation, wind speed, and cloud cover.
- 📅 **Daily forecast** with min/max temperature, daylight & sunshine duration, and cloud cover.
- 🌤️ **Day/night-aware icons** mapped from Open-Meteo weather codes using the location's sunrise/sunset.
- 🛡️ Backend **proxy with automatic retry** on transient network errors.

### Solar / Sungrow (iSolarCloud)
- ⚡ **Live production readings**: solar output, grid import/export, battery power & charge level, household load, and daily yield.
- 🏘️ **Per-roof (per-string) PV power** (e.g. East / West roof), supporting both plain grid-tied and hybrid/ESS (battery) inverters.
- 🌀 **Animated power-flow visualization** of energy moving between panels, battery, home, and grid.
- 📊 **Statistics page** with a monthly-production chart and a per-roof intraday power chart (Recharts).
- 🔐 **Cookie-based session** (httpOnly) with a login/logout dialog and live connection status.
- 🧪 **Graceful fallback** to demo/mock data before you connect, so the UI is fully usable without live credentials.

### AI outlook (Ollama)
- 🤖 **Natural-language daily summary** of the weather, how solar is tracking, and anything notable about battery/grid usage.
- 🗣️ **Language-aware** — the summary is written in the currently selected UI language.
- 💾 **Smart caching**: volatile readings are bucketed into the cache key so the 5-minute refresh mostly hits the cache, only re-prompting the model when conditions change meaningfully (1-hour TTL).

### News (Tagesschau)
- 📰 **Merged regional feed** (`ausland` + `inland`), deduplicated and sorted newest-first.
- 🖼️ **Normalized articles** with a 16:9 teaser image, kicker/region, breaking-news flag, and a link to the full story.
- 🗞️ Shown both as a **card on the home screen** and on a **dedicated news page**.
- ⏱️ **15-minute server-side cache** to stay within the upstream feed's rate limits.

### Architecture & DX
- 🧱 **pnpm + Turborepo monorepo** with a shared TypeScript contract package (`@repo/shared`) as the single source of truth for API routes and payload shapes.
- 🧩 **Type-safe file-based routing** (TanStack Router) and data fetching (TanStack Query).
- 🚀 **Deploy scripts** (`bin/`) for provisioning and shipping to a Debian/nginx host.

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend** (`apps/backend`): Express 5, TypeScript (ESM), `tsx` for dev, `node-cache` for caching, `openmeteo` + `ollama` clients
- **Frontend** (`apps/web`): Vite, React 19, TanStack Router + TanStack Query, Tailwind CSS v4, shadcn/radix-ui, Recharts
- **Shared** (`packages/shared`): TypeScript types and constants shared between backend and frontend, built with `tsup`

## Project structure

```
apps/
  backend/   Express API — weather (Open-Meteo), iSolarCloud/Sungrow, AI overview (Ollama), news (Tagesschau)
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

Configure the backend by copying the example env file and filling in your credentials:

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Description |
| --- | --- |
| `FRONTEND_ORIGIN` | Comma-separated list of origins allowed by CORS (default `http://localhost:5173`) |
| `PORT` | Backend port (default `4000`) |
| `OPENMETEO_URL` | Open-Meteo forecast API base URL |
| `TAGESSCHAU_NEWS_URL` | Tagesschau news feed base URL (region/ressort params are appended automatically) |
| `ISOLAR_CLOUD_URL` | iSolarCloud OpenAPI gateway base URL |
| `ISOLAR_CLOUD_APPKEY` | iSolarCloud app key |
| `ISOLAR_SECRET_KEY` | iSolarCloud access key |
| `OLLAMA_URL` | Ollama host for the AI overview (default `https://ollama.com`) |
| `OLLAMA_MODEL` | Model used to generate the outlook blurb |
| `OLLAMA_API_KEY` | Bearer token for the Ollama host (optional for local hosts) |

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

## API

The backend exposes the following endpoints (route paths are defined in `@repo/shared`'s `API_ROUTES`):

| Route | Description |
| --- | --- |
| `GET /health` | Service health check |
| `GET /weather` | Current conditions + daily forecast (Open-Meteo) |
| `POST /isolar/login` · `POST /isolar/logout` · `GET /isolar/status` | iSolarCloud session management |
| `GET /isolar/solar-data` | Live production / battery / grid / per-roof readings |
| `GET /isolar/statistics` | Monthly production + per-roof intraday power |
| `POST /ai/overview` | AI-generated daily outlook (Ollama) |
| `GET /news` | Normalized regional news feed (Tagesschau) |

## Deployment

`bin/deploy.sh` builds `apps/web` and copies the static output to a target directory on a server (default `/var/www/html`, i.e. nginx's default document root — the app is served at `/`), intended to run behind nginx, while the backend runs as a long-lived Node process. See `bin/install-deps.sh` for initial host provisioning. Run `bin/deploy.sh --help` for available flags.

## License

Released under the [MIT License](LICENSE).
