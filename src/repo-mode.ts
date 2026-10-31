import * as core from "@actions/core";
import { formatJson, formatMarkdown, runRepoChecks, type Report } from "waveforge-stellar";
import type { ActionInputs } from "./inputs.js";

export interface RepoModeDeps {
  core?: typeof core;
  workspaceRoot?: string;
  runRepoChecks?: typeof runRepoChecks;
}

export function parseFileLine(evidenceStr: string): { file: string; line: number } | null {
  const match = /^(.*?):(\d+)(?::\d+)?$/.exec(evidenceStr.trim());
  if (match && match[1] && match[2]) {
    const lineNum = Number.parseInt(match[2], 10);
    if (!Number.isNaN(lineNum)) {
      return {
        file: match[1],
        line: lineNum,
      };
    }
  }
  return null;
}

export async function runRepoMode(
  inputs: ActionInputs,
  deps?: RepoModeDeps,
): Promise<Report | undefined> {
  const actualCore = deps?.core ?? core;
  const root = deps?.workspaceRoot ?? process.env.GITHUB_WORKSPACE;

  if (!root) {
    actualCore.setFailed(
      "GITHUB_WORKSPACE environment variable is missing. Repository checks require a checked-out workspace.",
    );
    return undefined;
  }

  const checkFn = deps?.runRepoChecks ?? runRepoChecks;
  const report = await checkFn(root, {
    network: inputs.network,
    rpcUrl: inputs.rpcUrl,
    offline: inputs.offline,
  });

  // Write job summary
  await actualCore.summary.addRaw(formatMarkdown(report), true).write();

  // Emit file:line annotations for fail and warn results
  for (const result of report.results) {
    if (result.status === "fail" || result.status === "warn") {
      if (result.evidence && result.evidence.length > 0) {
        for (const ev of result.evidence) {
          const parsed = parseFileLine(ev);
          if (parsed) {
            const annotation = {
              file: parsed.file,
              startLine: parsed.line,
              title: `${result.id}: ${result.title}`,
            };
            if (result.status === "fail") {
              actualCore.error(result.message, annotation);
            } else {
              actualCore.warning(result.message, annotation);
            }
          }
        }
      }
    }
  }

  // Set outputs
  actualCore.setOutput("score", String(report.score));
  actualCore.setOutput("report-json", formatJson(report));

  // Failure rules
  const hasFail = report.results.some((r) => r.status === "fail");
  if (hasFail) {
    actualCore.setFailed("One or more repository checks failed.");
  } else if (inputs.failOnLowScore && report.score < inputs.minScore) {
    actualCore.setFailed(
      `Repository readiness score ${report.score} is below the minimum threshold ${inputs.minScore}.`,
    );
  }

  return report;
}
