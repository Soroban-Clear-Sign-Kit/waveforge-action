# WaveForge Action

`waveforge-action` is a GitHub Action for Stellar and Soroban repositories that lints issue descriptions and evaluates repository readiness for the Stellar Wave program. In `issue` mode it lints the issue body and keeps a single sticky comment (`<!-- waveforge -->`) updated, and in `repo` mode it runs repository checks on the checked-out workspace and writes a formatted GitHub Actions job summary.

Powered by the [waveforge](https://github.com/Soroban-Clear-Sign-Kit/waveforge) library (`https://github.com/Soroban-Clear-Sign-Kit/waveforge`).

---

## Quickstart

### 1. Issue Linting (`.github/workflows/issue-lint.yml`)

See [`examples/issue-lint.yml`](examples/issue-lint.yml):

```yaml
name: WaveForge Issue Lint

on:
  issues:
    types: [opened, edited]

permissions:
  issues: write

jobs:
  issue-lint:
    name: Lint Issue with WaveForge
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Lint issue body
        uses: Soroban-Clear-Sign-Kit/waveforge-action@v1
        with:
          mode: issue
          min-score: "70"
          comment: "true"
          fail-on-low-score: "false"
```

### 2. Repository Readiness Checks (`.github/workflows/repo-check.yml`)

See [`examples/repo-check.yml`](examples/repo-check.yml):

```yaml
name: WaveForge Repository Check

on:
  pull_request:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

jobs:
  repo-check:
    name: Run WaveForge Repository Checks
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run WaveForge repository checks
        uses: Soroban-Clear-Sign-Kit/waveforge-action@v1
        with:
          mode: repo
          min-score: "70"
          network: testnet
          offline: "false"
          fail-on-low-score: "false"
```

---

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `mode` | Execution mode (`'issue'` or `'repo'`) | `false` | `"issue"` |
| `min-score` | Minimum readiness score threshold (`0-100`) | `false` | `"70"` |
| `network` | Target Stellar network (`'testnet'` or `'mainnet'`) | `false` | `"testnet"` |
| `rpc-url` | Explicit Soroban RPC URL (required when targeting `mainnet`) | `false` | `""` |
| `offline` | Skip network RPC calls and mark network checks as skipped | `false` | `"false"` |
| `comment` | Whether to create or update diagnostic comment on the issue | `false` | `"true"` |
| `fail-on-low-score` | Fail the workflow step if score is below `min-score` | `false` | `"false"` |
| `github-token` | GitHub token for GitHub API interactions | `false` | `"${{ github.token }}"` |

---

## Outputs

| Output | Description |
| :--- | :--- |
| `score` | Calculated readiness score (`0-100`) |
| `suggested-complexity` | Suggested complexity level for the issue (`Trivial`, `Medium`, or `High`; set in `issue` mode) |
| `report-json` | Full JSON formatted report |

---

## Permissions per Mode

WaveForge Action follows the principle of least privilege:

| Mode | Required Permission | Reason |
| :--- | :--- | :--- |
| `issue` | `issues: write` | Reads the issue payload and creates or updates a single sticky comment (`<!-- waveforge -->`) on the issue. |
| `repo` | `contents: read` | Allows `actions/checkout@v4` to check out repository files for inspection and writes the job summary. |

---

## Example Comment and Job Summary

### Issue Comment (`mode: issue`)

When an issue is opened or edited, `waveforge-action` maintains **one** comment per issue identified by the hidden `<!-- waveforge -->` marker:

```markdown
<!-- waveforge -->

## WaveForge Issue Report

- **Target**: `Add multi-signer threshold verification to escrow contract`
- **Score**: **100%**
- **Generated At**: 2026-10-31T14:59:01.624Z

| Status | ID | Title | Message | Fix |
| :--- | :--- | :--- | :--- | :--- |
| SKIP | F1 | UI Visual Verification | Not a UI/frontend issue (does not mention .tsx, UI, page, or component). | Ask for screenshots or screen recordings if UI changes are introduced. |

**Suggested Complexity:** High

---
*Evaluated by WaveForge (waveforge-stellar v0.1.0)*
```

### Job Summary (`mode: repo`)

When running repository checks, `waveforge-action` writes the Markdown report directly to `GITHUB_STEP_SUMMARY`:

```markdown
## WaveForge Repository Report

- **Target**: `waveforge-action`
- **Score**: **100%**
- **Generated At**: 2026-10-31T14:58:38.322Z

| Status | ID | Title | Message | Fix |
| :--- | :--- | :--- | :--- | :--- |
| SKIP | R7 | Soroban Contracts and CI | No Soroban crates found. | Add a Soroban contract crate with soroban-sdk in Cargo.toml if this repository contains smart contracts. |
| SKIP | R8 | On-Chain Contract Verification | No contract IDs found in README.md or docs/*.md. | Document deployed contract IDs in README.md or docs/ when deployed. |
```

---

## Versioning

Pin workflows to either the major version tag `@v1` or a full semantic version tag:

- **Major version tag (recommended)**:
  ```yaml
  uses: Soroban-Clear-Sign-Kit/waveforge-action@v1
  ```
- **Exact release tag**:
  ```yaml
  uses: Soroban-Clear-Sign-Kit/waveforge-action@v0.1.0
  ```

---

## License

Apache-2.0 — see [LICENSE](LICENSE).
