# Contributing to WaveForge Action

Thank you for your interest in contributing to WaveForge Action! Please read the guidelines below before opening issues or submitting pull requests.

## 1. What the Action Does

WaveForge Action runs Soroban and repository readiness checks on GitHub repositories and writes comprehensive job summaries. When triggered on issues, it lints the issue body against readiness standards and keeps a single sticky status comment updated.

## 2. Setup

- **Prerequisites**: Node.js 20 (`node >= 20`) and pnpm 9 (`packageManager: pnpm@9.x`).
- **Install dependencies**: `pnpm install`
- **Run linting**: `pnpm lint`
- **Run typecheck**: `pnpm typecheck`
- **Run tests**: `pnpm test`
- **Build bundle**: `pnpm build`
- **Important**: GitHub Actions runs the pre-bundled file in `dist/` directly without installing dependencies. Always run `pnpm build` and commit `dist/` whenever modifying files in `src/`.

## 3. Testing

- **Unit tests**: Run `pnpm test` to execute Vitest unit tests. Unit tests mock `@actions/core` and `@actions/github` to test logic in isolation.
- **Local full runs**: Use `scripts/local-run.mjs` (introduced in step 08) for end-to-end local runs simulating GitHub Actions workflows outside CI.
- **Sandbox repository flow**: Test against sandbox repositories to verify check execution, summary generation, and issue comment updates under real-world conditions.

## 4. Scope

This repository strictly owns `action.yml`, `src/`, the committed `dist/` bundle, issue comments, job summaries, outputs, and example workflows. It does not own any check, rule, score calculation, or formatting logic. All check and rule improvements must be contributed upstream to [`waveforge`](https://github.com/Soroban-Clear-Sign-Kit/waveforge).

## 5. Branching and Pull Requests

- **Branch naming convention**: Name branches using `issue-<number>-<short-name>` (for example, `issue-42-fix-summary`).
- **One issue per PR**: Keep pull requests focused on a single issue.
- **Closing reference**: Always reference the issue in your PR description using `Closes #<number>`.

## 6. Stellar Wave

This repository takes part in the Stellar Wave program on Drips. Maintainers add issues in the Drips Wave app, and the Drips Wave bot labels them "Stellar Wave". During an active Wave (usually one week each month) contributors sign in at drips.network/wave with GitHub and apply to an issue; the maintainer assigns one applicant. Merged work earns points by complexity: Trivial 100, Medium 150, High 200. Rewards are shared by points after the Wave. For more details, visit https://docs.drips.network/wave.

## 7. Action Rules

Contributors must uphold the following core Action rules from `AGENTS.md`:
- **Never log secrets**: Never log the GitHub token or any secret. Mask sensitive strings with `core.setSecret` whenever necessary.
- **Least privilege**: Strictly document and adhere to the exact GitHub permissions each action mode requires.
- **Single issue comment**: Keep exactly one comment per issue, identified by the hidden marker `<!-- waveforge -->`.
- **dist/ matches source**: `dist/` must always match `src/`. Rebuild with `pnpm build` and commit `dist/` alongside any changes to `src/`.
