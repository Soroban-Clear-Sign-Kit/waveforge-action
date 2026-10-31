# Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-16 | dist/ committed | GitHub runs the bundle without installing dependencies |
| 2026-10-16 | Library from npm, exact version | One source of truth for checks |
| 2026-10-16 | GitHub owner: Soroban-Clear-Sign-Kit | Recorded from git remote origin URL |
| 2026-10-29 | Package name: waveforge-stellar | User confirmed waveforge-stellar as the waveforge npm library |
| 2026-10-29 | Upstream API doc fetch fallback | v0.1.0 tag returned 404; fetched from main branch of Soroban-Clear-Sign-Kit/waveforge |
| 2026-10-29 | Bundle format ESM | dist/index.js with createRequire banner runs successfully under Node 20 |
| 2026-10-31 | Local-run CLI argument mapping | Positional `.json` or `--event` sets `GITHUB_EVENT_PATH` (defaulting to `examples/events/issue-opened.json` in issue mode); positional directory or `--workspace` sets `GITHUB_WORKSPACE` (defaulting to `cwd`); other `--<flag>` flags map to `INPUT_<FLAG>` preserving hyphens to match `@actions/core` |
