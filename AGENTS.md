# AGENTS.md - waveforge-action
## Project
waveforge-action is a JavaScript GitHub Action (runs: node20) that uses
the waveforge npm library. Mode "issue" lints the issue body and keeps
ONE comment updated. Mode "repo" runs repo checks on the checked-out
workspace and writes a job summary. The bundle in dist/ is committed
because GitHub runs it directly.
## Scope boundary
This repository owns action.yml, src/, the committed dist/ bundle,
comments, summaries, outputs and example workflows. It does NOT own any
check, rule, score or formatter (repository waveforge). Import them from
the waveforge package; never copy or re-implement them. If the library
lacks something, write it to docs/UPSTREAM-REQUESTS.md and stop with
STEP <n> BLOCKED.
## Action rules
- Never log the token or any secret. Mask with core.setSecret if needed.
- Least privilege: document the exact permissions each mode needs.
- One comment per issue, found by the hidden marker <!-- waveforge -->.
- dist/ must always match the source: rebuild in every step that changes
src/ and commit dist/ with it.
## Hard rules
1. Work only on the step you were given. Never start the next step.
2. Build only what the step specifies: no extra features, files,
packages, options or refactors. When something is unspecified, pick
the smallest option that meets the requirement and log it in
docs/DECISIONS.md.
3. Never use an SDK, CLI or library API from memory. Read the installed
type definitions (node_modules), crate source (~/.cargo/registry) or
`<command> --help` first. If a step names an API that does not exist
in the installed version, use the real equivalent and log the mapping
in docs/DECISIONS.md.
4. Never add a dependency the step does not name. Ask me first.
5. Pin exact versions. Keep VERSIONS.md current (name, version, date).
6. Never commit secrets or print secret keys. .env files are git-ignored;
commit .env.example with placeholders only.
7. Write tests in the same step as the code. Never delete, skip or weaken
a test, lint rule or type check to get green.
8. Run every command non-interactively (--yes, CI=1, explicit flags). If
a command waits for input, stop it and find the flag.
9. Never run git add, git commit or git push during a build step. Git
actions happen only when I send a "Commit and push" prompt.
10. Never claim something works unless you ran it in this session and saw
it pass. Report real output, including failures.
11. If the network is unreachable, finish the offline work, mark network
checks "pending" in docs/PROGRESS.md, and report BLOCKED with the
exact commands I should run.
12. Never create, edit or delete files outside this repository folder,
including sibling repositories that sit next to it on disk.
## Commit and push prompts
When I send "Commit and push step <n>":
- Run git status. If a changed file is outside the scope of step <n>, or
any .env file, secret, node_modules, target/ or build output that the
step did not ask to commit is listed, stop and tell me.
- Otherwise run git add -A, git commit with the exact message I give,
then git push origin main.
- Never force push, amend pushed commits, rebase, change git config or
change remotes. If the push is rejected, stop and show the error.
- Reply with the commit hash and the push output. Last line: PUSHED <n>
## End of every build step
Append to docs/PROGRESS.md: date, step number, what was built, commands
run with results, open issues. Then reply with these sections: Summary /
Commands run and results / Files changed / Decisions logged / Open
issues. The last line must be exactly one of:
STEP <n> DONE
STEP <n> BLOCKED: <one-line reason>
## Commands
pnpm lint | pnpm typecheck | pnpm test | pnpm build (writes dist/)
