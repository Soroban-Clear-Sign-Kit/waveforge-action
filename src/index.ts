import * as core from "@actions/core";
import { readInputs, type ActionInputs } from "./inputs.js";

export async function runIssueMode(inputs: ActionInputs): Promise<void> {
  core.info(`Running issue mode (min-score: ${inputs.minScore})`);
}

export async function runRepoMode(inputs: ActionInputs): Promise<void> {
  core.info(`Running repo mode (network: ${inputs.network})`);
}

export async function run(): Promise<void> {
  const inputs = readInputs();
  if (!inputs) {
    return;
  }

  core.info("waveforge-action ready");

  if (inputs.mode === "issue") {
    await runIssueMode(inputs);
  } else {
    await runRepoMode(inputs);
  }
}

void run();
