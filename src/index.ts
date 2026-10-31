import * as core from "@actions/core";
import * as github from "@actions/github";
import { readInputs } from "./inputs.js";
import { runIssueMode } from "./issue-mode.js";
import { runRepoMode } from "./repo-mode.js";

export async function run(): Promise<void> {
  const inputs = readInputs();
  if (!inputs) {
    return;
  }

  core.info("waveforge-action ready");

  if (inputs.mode === "issue") {
    const octokit = inputs.githubToken
      ? github.getOctokit(inputs.githubToken)
      : undefined;
    await runIssueMode(
      inputs,
      octokit ? { core, context: github.context, octokit } : undefined,
    );
  } else {
    await runRepoMode(inputs, { core });
  }
}

void run();
