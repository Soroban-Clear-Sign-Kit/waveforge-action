# WaveForge Action

A GitHub Action for running [WaveForge](https://github.com/Soroban-Clear-Sign-Kit/waveforge) Soroban and repository readiness checks and linting issue descriptions.

## Overview

- **Repo Mode**: Runs readiness checks on checked-out repository code and writes a formatted job summary to GitHub Actions.
- **Issue Mode**: Lints issue markdown descriptions and maintains an updated sticky diagnostic comment.

## Documentation and Policies

- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [License (Apache-2.0)](LICENSE)
- [Decisions Log](docs/DECISIONS.md)
- [Progress Log](docs/PROGRESS.md)

## Permissions

WaveForge Action adheres to the principle of least privilege:
- `contents: read` (Repo mode: to inspect checked-out repository files)
- `issues: write` (Issue mode: to read issue details and create/update diagnostic comments)
- `pull-requests: write` (Pull Request mode: to write comments or summaries)
