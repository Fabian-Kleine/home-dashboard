#!/usr/bin/env bash
set -euo pipefail

# Simple CLI: support --no-git to skip git operations
NO_GIT=0
for arg in "$@"; do
	case "$arg" in
		--no-git) NO_GIT=1 ;;
		*) ;;
	esac
done

if [ "$NO_GIT" -eq 0 ]; then
	git fetch --all
	git reset --hard origin/main
	git pull origin main
else
	echo "Skipping git commands (--no-git)"
fi

cd ./apps/web

pnpm run build

sudo cp -r ./dist/* /var/www/html/home-dashboard