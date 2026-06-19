#!/usr/bin/env bash
# Initialize native references for the fivem-natives skill.
# Run from the repo root: .agents/skills/fivem-natives/setup.sh

set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. GTA V natives (submodule)
if [ -d "$SKILL_DIR/natives" ] && [ -n "$(ls -A "$SKILL_DIR/natives" 2>/dev/null)" ]; then
    echo "GTA V natives already initialized."
elif [ -d "$SKILL_DIR/natives" ]; then
    echo "Initializing GTA V natives submodule…"
    git -C "$SKILL_DIR/.." submodule update --init --recursive
else
    echo "GTA V natives already initialized."
fi

# 2. CFX natives (sparse clone — only ext/native-decls/)
if [ -d "$SKILL_DIR/cfx-natives/ext/native-decls" ]; then
    echo "CFX natives already initialized."
else
    echo "Cloning CFX natives (sparse, ~6MB)…"
    git -c protocol.file.allow=always clone \
        --depth 1 \
        --filter=blob:none \
        --sparse \
        https://github.com/citizenfx/fivem.git \
        "$SKILL_DIR/cfx-natives"
    git -C "$SKILL_DIR/cfx-natives" sparse-checkout set ext/native-decls
    echo "CFX natives ready at cfx-natives/ext/native-decls/"
fi

echo "Done. Native references are ready."
