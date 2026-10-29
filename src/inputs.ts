import * as core from "@actions/core";

export type Mode = "issue" | "repo";
export type Network = "testnet" | "mainnet";

export interface ActionInputs {
  mode: Mode;
  minScore: number;
  network: Network;
  rpcUrl?: string;
  offline: boolean;
  comment: boolean;
  failOnLowScore: boolean;
  githubToken: string;
}

export function readInputs(): ActionInputs | null {
  try {
    const modeRaw = core.getInput("mode") || "issue";
    if (modeRaw !== "issue" && modeRaw !== "repo") {
      core.setFailed(`Invalid mode: "${modeRaw}". Must be "issue" or "repo".`);
      return null;
    }

    const minScoreRaw = core.getInput("min-score") || "70";
    const minScore = Number(minScoreRaw);
    if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
      core.setFailed(
        `Invalid min-score: "${minScoreRaw}". Must be an integer between 0 and 100.`,
      );
      return null;
    }

    const networkRaw = core.getInput("network") || "testnet";
    if (networkRaw !== "testnet" && networkRaw !== "mainnet") {
      core.setFailed(
        `Invalid network: "${networkRaw}". Must be "testnet" or "mainnet".`,
      );
      return null;
    }

    const rpcUrl = core.getInput("rpc-url") || undefined;
    if (networkRaw === "mainnet" && !rpcUrl) {
      core.setFailed('Network "mainnet" requires an explicit "rpc-url" input.');
      return null;
    }

    const offline = core.getInput("offline")
      ? core.getBooleanInput("offline")
      : false;
    const comment = core.getInput("comment")
      ? core.getBooleanInput("comment")
      : true;
    const failOnLowScore = core.getInput("fail-on-low-score")
      ? core.getBooleanInput("fail-on-low-score")
      : false;

    const githubToken = core.getInput("github-token");
    if (githubToken) {
      core.setSecret(githubToken);
    }

    return {
      mode: modeRaw,
      minScore,
      network: networkRaw,
      rpcUrl,
      offline,
      comment,
      failOnLowScore,
      githubToken,
    };
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
    return null;
  }
}
