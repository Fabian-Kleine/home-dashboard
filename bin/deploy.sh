#!/usr/bin/env bash
set -euo pipefail

# Deploy helper for monorepo
# Defaults: operate from repo root, build `apps/web`, copy `dist` to target

# Flags:
#   --no-git       Skip git fetch/reset/pull
#   --no-install   Skip `pnpm install` at repo root
#   --no-sudo      Do not use sudo when copying to target
#   --app <path>   App directory relative to repo root (default: apps/web)
#   --target <dir> Target deploy directory (default: /var/www/html/home-dashboard)

NO_GIT=0
NO_INSTALL=0
USE_SUDO=1
APP_DIR="apps/web"
TARGET_DIR="/var/www/html/home-dashboard"

while [ $# -gt 0 ]; do
	case "$1" in
		--no-git) NO_GIT=1; shift ;;
		--no-install) NO_INSTALL=1; shift ;;
		--no-sudo) USE_SUDO=0; shift ;;
		--app) APP_DIR="$2"; shift 2 ;;
		--target) TARGET_DIR="$2"; shift 2 ;;
		--help)
			echo "Usage: $0 [--no-git] [--no-install] [--no-sudo] [--app <path>] [--target <dir>]"
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

echo "Deployment complete."