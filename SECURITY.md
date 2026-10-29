# Security Policy

## Reporting Security Issues

Please report security issues and vulnerabilities privately rather than opening a public issue.
You can report vulnerabilities by submitting a private advisory through GitHub under the Security tab:
[Report a vulnerability](https://github.com/Soroban-Clear-Sign-Kit/waveforge-action/security/advisories/new).

## Token and Permissions

This Action uses only the standard `GITHUB_TOKEN` secret provided by GitHub Actions. It does not require or accept external credentials, private keys, or third-party API keys. The Action operates under least privilege using only the permissions explicitly documented in the [README](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge-action/README.md).

## Scope of Security Responsibilities

`waveforge-action` is the GitHub Action integration wrapper that executes checks and reports summaries or comments. The underlying check, rule, score, and lint logic lives in the upstream [`waveforge`](https://github.com/Soroban-Clear-Sign-Kit/waveforge) library (`waveforge-stellar`). Security reports pertaining to readiness rules or verification algorithms should be reported to the `waveforge` upstream repository.
