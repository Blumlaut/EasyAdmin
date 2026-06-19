---
name: fivem-natives
description: Look up GTA V and CFX native functions available in FiveM. Use when writing or reviewing FiveM Lua/JS code that calls natives (entity, ped, vehicle, camera, blip, network, state bags, etc.) or when you need parameter details, return types, or function signatures.
---

# FiveM Native Reference

This skill provides access to native function documentation from two sources:

| Source | Location | Contents |
|---|---|---|
| GTA V natives | `natives/` | 6,400+ original game natives, organized by namespace |
| CFX natives | `cfx-natives/ext/native-decls/` | 800+ FiveM-specific natives (state bags, DUI, runtime textures, etc.) |

## Setup

Only run this if `natives/` or `cfx-natives/` are missing or appear empty/outdated:

```bash
.agents/skills/fivem-natives/setup.sh
```

This initializes the `natives/` git submodule and does a sparse clone (~6MB) of the CFX natives. Running the script again will update both sources to their latest versions.

## GTA V Natives (`natives/`)

Each native is a `.md` file organized by namespace:

```
natives/{NAMESPACE}/{NATIVE_NAME}.md
```

For example: `natives/ENTITY/AttachEntityToEntity.md`

Common namespaces: `ENTITY`, `PED`, `VEHICLE`, `PLAYER`, `CAM`, `GRAPHICS`, `NETWORK`, `SCRIPT`, `FIRE`, `OBJECT`, `TASK`, `HUD`, `MISC`, `STREAMING`, `WEAPON`, `ZONE`

## CFX Natives (`cfx-natives/ext/native-decls/`)

Flat directory — one `.md` per native. Each file has frontmatter with `apiset: client|server|shared` indicating where it runs.

## Finding Natives

**Search by name across both sources:**
```bash
find .agents/skills/fivem-natives/natives .agents/skills/fivem-natives/cfx-natives -iname "*ATTACH_ENTITY*"
```

**Search within a GTA V namespace:**
```bash
find .agents/skills/fivem-natives/natives/VEHICLE/ -iname "*DOOR*"
```

**Grep for a concept:**
```bash
grep -ril "ragdoll" .agents/skills/fivem-natives/natives/
```

**Filter CFX natives by apiset:**
```bash
grep -l "apiset: client" .agents/skills/fivem-natives/cfx-natives/ext/native-decls/*.md
```

## Usage

Read the matching `.md` file(s) with the `read` tool. Each file contains:

- C-style function signature with hashes
- Description
- Parameter list with types and explanations
- Return value (if applicable)
- Code examples (CFX natives often include Lua/JS/CS examples)
