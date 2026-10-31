import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const distEntry = resolve(repoRoot, "dist", "index.js");
const defaultIssueEventPath = resolve(
  repoRoot,
  "examples",
  "events",
  "issue-opened.json",
);

function parseCliArgs(argv) {
  /** @type {Record<string, string>} */
  const inputs = {};
  /** @type {string | undefined} */
  let workspacePath;
  /** @type {string | undefined} */
  let eventPath;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }

    if (arg.startsWith("--")) {
      const withoutPrefix = arg.slice(2);
      const eqIdx = withoutPrefix.indexOf("=");
      let flagName;
      let flagValue;

      if (eqIdx !== -1) {
        flagName = withoutPrefix.slice(0, eqIdx);
        flagValue = withoutPrefix.slice(eqIdx + 1);
      } else {
        flagName = withoutPrefix;
        const nextArg = argv[i + 1];
        if (nextArg !== undefined && !nextArg.startsWith("--")) {
          flagValue = nextArg;
          i++;
        } else {
          flagValue = "true";
        }
      }

      const normalizedFlag = flagName.trim().toLowerCase();
      if (normalizedFlag === "workspace") {
        workspacePath = resolve(flagValue);
      } else if (normalizedFlag === "event" || normalizedFlag === "event-path") {
        eventPath = resolve(flagValue);
      } else if (normalizedFlag.length > 0) {
        const envKey = `INPUT_${normalizedFlag.replace(/ /g, "_").toUpperCase()}`;
        inputs[envKey] = flagValue;
      }
    } else if (arg.toLowerCase().endsWith(".json") && eventPath === undefined) {
      eventPath = resolve(arg);
    } else if (workspacePath === undefined) {
      workspacePath = resolve(arg);
    } else if (eventPath === undefined) {
      eventPath = resolve(arg);
    }
  }

  return { inputs, workspacePath, eventPath };
}

function main() {
  const { inputs, workspacePath, eventPath } = parseCliArgs(
    process.argv.slice(2),
  );

  const mode = (inputs["INPUT_MODE"] ?? "issue").trim().toLowerCase();
  if (mode === "issue") {
    inputs["INPUT_COMMENT"] = "false";
  }

  const tempDir = mkdtempSync(join(tmpdir(), "waveforge-local-run-"));
  const summaryPath = join(tempDir, "step-summary.md");
  writeFileSync(summaryPath, "", "utf8");

  try {
    /** @type {Record<string, string | undefined>} */
    const childEnv = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (
        !key.startsWith("INPUT_") &&
        key !== "GITHUB_OUTPUT" &&
        key !== "GITHUB_ENV" &&
        key !== "GITHUB_STATE" &&
        key !== "GITHUB_PATH" &&
        key !== "GITHUB_STEP_SUMMARY" &&
        key !== "GITHUB_EVENT_PATH" &&
        key !== "GITHUB_WORKSPACE"
      ) {
        childEnv[key] = value;
      }
    }

    Object.assign(childEnv, inputs);
    childEnv["GITHUB_WORKSPACE"] = workspacePath ?? process.cwd();
    childEnv["GITHUB_STEP_SUMMARY"] = summaryPath;

    if (mode === "issue") {
      childEnv["GITHUB_EVENT_PATH"] = eventPath ?? defaultIssueEventPath;
    } else if (eventPath !== undefined) {
      childEnv["GITHUB_EVENT_PATH"] = eventPath;
    }

    const result = spawnSync(process.execPath, [distEntry], {
      env: childEnv,
      stdio: "inherit",
    });

    const summaryContent = readFileSync(summaryPath, "utf8");
    process.stdout.write("\n--- GITHUB_STEP_SUMMARY ---\n");
    if (summaryContent.length > 0) {
      process.stdout.write(summaryContent);
      if (!summaryContent.endsWith("\n")) {
        process.stdout.write("\n");
      }
    } else {
      process.stdout.write("(empty)\n");
    }

    if (result.error) {
      throw result.error;
    }
    process.exitCode = result.status ?? 1;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();

