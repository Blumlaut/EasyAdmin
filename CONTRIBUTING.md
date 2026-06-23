# Contributing to EasyAdmin

Thank you for your interest in contributing! Please read the following guidelines before submitting changes.

## Reporting Issues

Before opening an issue, please check that it hasn't already been reported.

When creating issues, **always use the provided templates** in [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/). Removing or leaving a template blank will result in your issue being locked.

| Template | Use When |
|---|---|
| `bug_report.md` | Something is broken or behaving unexpectedly |
| `feature_request.md` | Suggesting a new feature or improvement |
| `support-.md` | Having trouble using EasyAdmin |
| `z_other.md` | Anything that doesn't fit the above |

## Code Style and Organization

- Follow the conventions and style of existing code in the files you modify.
- **Keep new features in their own files.** New functionality should live in dedicated files within the appropriate directory (`server/features/`, `client/`, etc.) rather than appending to existing files. This keeps the codebase maintainable and makes it easier to locate and review changes.

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Format: `type(scope): description`.

Common types: `fix`, `feat`, `docs`, `style`, `refactor`, `test`, `chore`. The scope is optional and usually refers to the area changed (e.g. `nui`, `server`, `bot`).

**Examples:**
- `fix(nui): visual error when hovering over button element`
- `feat(server): add admin note system`
- `docs: update convar reference`

## Pull Requests

### Testing

**All pull requests must be tested by the submitter before being opened.** We expect you to have verified that your changes work correctly and don't break existing functionality. AI cannot verify that code works — only actual testing can.

### Documentation

If your PR adds new features or changes existing behavior, **update the relevant documentation**. This includes but is not limited to:

- New configuration options or convars
- Changed default behavior
- New commands or events
- API changes

### AI Usage Disclosure

- AI assistance **must be disclosed in the PR body** when AI tools were used to generate or suggest code.
- Using `Co-Authored-By` trailer in commit messages is **optional**, not required.
- The PR body disclosure is the important part — it ensures transparency for reviewers.

## Repository Structure

Familiarize yourself with the repo layout before contributing:

| Directory | Purpose |
|---|---|
| `fxmanifest.lua` | Resource manifest — entry point and configuration |
| `client/` | Client-side FiveM logic (Lua) |
| `server/` | Server-side FiveM logic (Lua) |
| `shared/` | Code shared between client and server |
| `nui/` | Frontend UI (Next.js/TypeScript, runs in CEF) |
| `language/` | Internationalization (i18n) files |
| `bot/` | Discord bot code (Node.js) |
| `docs/` | EasyAdmin documentation |
| `plugins/` | Plugin system files |

## Questions?

If you're unsure about something, open an issue first to discuss your idea before submitting a PR.
