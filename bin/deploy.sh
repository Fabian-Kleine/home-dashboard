#!/usr/bin/env bash
set -euo pipefail

# Deploy helper for monorepo
# Defaults: operate from repo root, build `apps/web`, copy `dist` to target

# Flags:
#   --no-git         Skip git fetch/reset/pull
#   --no-install     Skip `pnpm install` at repo root
#   --no-sudo        Do not use sudo when copying to target
#   --no-restart     Skip rebuilding and restarting the backend node process
#   --app <path>     App directory relative to repo root (default: apps/web)
#   --backend <path> Backend directory relative to repo root (default: apps/backend)
#   --target <dir>   Target deploy directory (default: /var/www/html)

NO_GIT=0
NO_INSTALL=0
USE_SUDO=1
NO_RESTART=0
APP_DIR="apps/web"
BACKEND_DIR="apps/backend"
TARGET_DIR="/var/www/html"

while [ $# -gt 0 ]; do
	case "$1" in
		--no-git) NO_GIT=1; shift ;;
		--no-install) NO_INSTALL=1; shift ;;
		--no-sudo) USE_SUDO=0; shift ;;
		--no-restart) NO_RESTART=1; shift ;;
		--app) APP_DIR="$2"; shift 2 ;;
		--backend) BACKEND_DIR="$2"; shift 2 ;;
		--target) TARGET_DIR="$2"; shift 2 ;;
		--help)
			echo "Usage: $0 [--no-git] [--no-install] [--no-sudo] [--no-restart] [--app <path>] [--backend <path>] [--target <dir>]"
			exit 0
			;;
		*) echo "Unknown arg: $1" >&2; exit 1 ;;
	esac
done

# Determine repository root (assumes this script is in <repo>/bin)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." >/dev/null 2>&1 && pwd)"
cd "$REPO_ROOT"

if [ "$NO_GIT" -eq 0 ]; then
	git fetch --all
	git reset --hard origin/main
	git pull origin main
else
	echo "Skipping git commands (--no-git)"
fi

if [ "$NO_INSTALL" -eq 0 ]; then
	pnpm install
else
	echo "Skipping pnpm install (--no-install)"
fi

# Build the requested app
if [ ! -d "$APP_DIR" ]; then
	echo "App directory not found: $APP_DIR" >&2
	exit 1
fi

cd "$APP_DIR"
pnpm run build

SRC_DIST_DIR="$REPO_ROOT/$APP_DIR/dist"
if [ ! -d "$SRC_DIST_DIR" ]; then
	echo "Build output not found: $SRC_DIST_DIR" >&2
	exit 1
fi

echo "Deploying $SRC_DIST_DIR -> $TARGET_DIR"
if [ "$USE_SUDO" -eq 1 ]; then
	sudo mkdir -p "$TARGET_DIR"
	sudo cp -r "$SRC_DIST_DIR/"* "$TARGET_DIR"
else
	mkdir -p "$TARGET_DIR"
	cp -r "$SRC_DIST_DIR/"* "$TARGET_DIR"
fi

echo "Frontend deployment complete."

# Rebuild and restart the backend so code changes take effect.
if [ "$NO_RESTART" -eq 1 ]; then
	echo "Skipping backend restart (--no-restart)"
	echo "Deployment complete."
	exit 0
fi

cd "$REPO_ROOT"

if [ ! -d "$BACKEND_DIR" ]; then
	echo "Backend directory not found: $BACKEND_DIR" >&2
	exit 1
fi

echo "Building backend ($BACKEND_DIR)"
# @repo/shared is a build-time dependency of the backend; rebuild it first so
# the backend's tsc build resolves against the current shared dist.
pnpm --filter @repo/shared build
(cd "$BACKEND_DIR" && pnpm run build)

BACKEND_ENTRY="$REPO_ROOT/$BACKEND_DIR/dist/server.js"
if [ ! -f "$BACKEND_ENTRY" ]; then
	echo "Backend build output not found: $BACKEND_ENTRY" >&2
	exit 1
fi

echo "Stopping running backend (if any)"
# Match the absolute entry path so we don't hit unrelated node processes.
# pkill returns non-zero when nothing matches, which is fine on a first deploy.
pkill -f "$BACKEND_ENTRY" && sleep 1 || true

BACKEND_LOG="$REPO_ROOT/$BACKEND_DIR/backend.log"
echo "Starting backend -> $BACKEND_LOG"
# Launch detached (new session, no controlling terminal) so it survives this
# script and the SSH session. cwd is the backend dir so dotenv finds its .env.
cd "$REPO_ROOT/$BACKEND_DIR"
setsid nohup node "$BACKEND_ENTRY" >"$BACKEND_LOG" 2>&1 < /dev/null &
BACKEND_PID=$!
echo "Backend restarted (PID $BACKEND_PID)"

echo "Deployment complete."