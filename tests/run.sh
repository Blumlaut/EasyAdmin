#!/usr/bin/env bash
# Run the Lua test suite
# Usage: ./tests/run.sh [busted args...]
#
# Examples:
#   ./tests/run.sh              # Run all tests
#   ./tests/run.sh --tap        # TAP output
#   ./tests/run.sh tests/foo_spec.lua  # Run single file
#   ./tests/run.sh --filter="duplicate"  # Filter by test name

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

exec busted --helper="$SCRIPT_DIR/bootstrap.lua" "$@"
