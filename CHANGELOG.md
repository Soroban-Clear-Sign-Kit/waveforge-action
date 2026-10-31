# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-10-31

### Added
- `issue` mode (`runIssueMode`): lints GitHub issue descriptions using `waveforge-stellar` (`runIssueLint`), maintains a single sticky comment identified by `<!-- waveforge -->` with pagination, and emits `score`, `suggested-complexity`, and `report-json` outputs.
- `repo` mode (`runRepoMode`): executes repository readiness checks (`runRepoChecks`) on `GITHUB_WORKSPACE`, writes a Markdown report to `GITHUB_STEP_SUMMARY`, emits `file:line` GitHub error/warning annotations, and sets `score` and `report-json` outputs.
- Input parsing and validation (`readInputs`) for `mode`, `min-score`, `network`, `rpc-url`, `offline`, `comment`, `fail-on-low-score`, and `github-token` (masked with `core.setSecret`).
- Local execution harness (`scripts/local-run.mjs`) and realistic webhook payload fixture (`examples/events/issue-opened.json`).
- Copy-paste example workflows (`examples/issue-lint.yml`, `examples/repo-check.yml`), CI workflow (`.github/workflows/ci.yml`), and self-test workflow (`.github/workflows/self-test.yml`).
