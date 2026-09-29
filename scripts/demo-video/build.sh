#!/usr/bin/env bash
# Build a demo video: record the NUI walkthrough with Playwright (native
# compositor frames via CDP, up to 60 fps, no interpolation), then encode the
# frame sequence to h264 mp4.
#
# Usage:
#   bash scripts/demo-video/build.sh                    # default video
#   bash scripts/demo-video/build.sh social-teaser      # another video by name
#   bash scripts/demo-video/build.sh --list             # list videos
#   bash scripts/demo-video/build.sh --url http://127.0.0.1:5199   # reuse a dev server
#   bash scripts/demo-video/build.sh --keep-frames      # keep out/frames/
set -euo pipefail
cd "$(dirname "$0")"

# Playwright is not a repo dependency. If it does not resolve locally, fall
# back to the globally-installed @playwright/mcp copy via NODE_PATH.
if ! node -e "require.resolve('playwright')" >/dev/null 2>&1; then
	GLOBAL_PW="$(npm root -g)/@playwright/mcp/node_modules"
	if [[ -d "$GLOBAL_PW/playwright" ]]; then
		export NODE_PATH="$GLOBAL_PW"
	else
		echo 'playwright not found, run: npm i -D playwright && npx playwright install chromium' >&2
		exit 1
	fi
fi

exec node build.mjs "$@"
