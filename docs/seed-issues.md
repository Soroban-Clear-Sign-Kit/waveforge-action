# Seed Issues

This document lists the 9 self-contained seed issues for `waveforge-action` (3 Trivial, 3 Medium, 3 High). None require secrets, mainnet funds, maintainer-only access, or changes in another repository.

| # | File | Title | Complexity | Points | Labels |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | [`docs/seed-issues/01.md`](seed-issues/01.md) | Skip automated bot accounts and closed issues in issue mode | Trivial | 100 | `enhancement,good first issue` |
| 02 | [`docs/seed-issues/02.md`](seed-issues/02.md) | Add GitHub Marketplace listing readiness checklist to docs | Trivial | 100 | `documentation,good first issue` |
| 03 | [`docs/seed-issues/03.md`](seed-issues/03.md) | Add rendered issue comment and job summary screenshots to README | Trivial | 100 | `documentation,good first issue` |
| 04 | [`docs/seed-issues/04.md`](seed-issues/04.md) | Add dry-run input to preview comments and summaries without side effects | Medium | 150 | `enhancement` |
| 05 | [`docs/seed-issues/05.md`](seed-issues/05.md) | Add label-below-score input to apply a needs-detail label on low-scoring issues | Medium | 150 | `enhancement` |
| 06 | [`docs/seed-issues/06.md`](seed-issues/06.md) | Cache Stellar RPC ledger verification responses across workflow steps | Medium | 150 | `enhancement,performance` |
| 07 | [`docs/seed-issues/07.md`](seed-issues/07.md) | Support pull_request mode to lint linked issues from PR descriptions | High | 200 | `enhancement` |
| 08 | [`docs/seed-issues/08.md`](seed-issues/08.md) | Add end-to-end integration test suite with a local fake GitHub REST API server | High | 200 | `testing` |
| 09 | [`docs/seed-issues/09.md`](seed-issues/09.md) | Refactor local-run harness to capture and assert structured GitHub Actions workflow commands | High | 200 | `enhancement,testing` |

## `gh issue create` Commands

```bash
gh issue create --title "Skip automated bot accounts and closed issues in issue mode" --body-file docs/seed-issues/01.md --label "enhancement,good first issue"
gh issue create --title "Add GitHub Marketplace listing readiness checklist to docs" --body-file docs/seed-issues/02.md --label "documentation,good first issue"
gh issue create --title "Add rendered issue comment and job summary screenshots to README" --body-file docs/seed-issues/03.md --label "documentation,good first issue"
gh issue create --title "Add dry-run input to preview comments and summaries without side effects" --body-file docs/seed-issues/04.md --label "enhancement"
gh issue create --title "Add label-below-score input to apply a needs-detail label on low-scoring issues" --body-file docs/seed-issues/05.md --label "enhancement"
gh issue create --title "Cache Stellar RPC ledger verification responses across workflow steps" --body-file docs/seed-issues/06.md --label "enhancement,performance"
gh issue create --title "Support pull_request mode to lint linked issues from PR descriptions" --body-file docs/seed-issues/07.md --label "enhancement"
gh issue create --title "Add end-to-end integration test suite with a local fake GitHub REST API server" --body-file docs/seed-issues/08.md --label "testing"
gh issue create --title "Refactor local-run harness to capture and assert structured GitHub Actions workflow commands" --body-file docs/seed-issues/09.md --label "enhancement,testing"
```
