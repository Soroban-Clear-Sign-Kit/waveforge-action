import * as core from "@actions/core";
import * as github from "@actions/github";
import { formatJson, formatMarkdown, runIssueLint, type Report } from "waveforge-stellar";
import type { ActionInputs } from "./inputs.js";

export const MARKER = "<!-- waveforge -->";
export const WAVEFORGE_VERSION = "0.1.0";

export interface IssueContextPayload {
  issue?: {
    title?: string;
    body?: string | null;
    number?: number;
  };
}

export interface OctokitLike {
  rest: {
    issues: {
      listComments: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        per_page?: number;
        page?: number;
      }) => Promise<{ data: Array<{ id: number; body?: string }> }>;
      createComment: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        body: string;
      }) => Promise<unknown>;
      updateComment: (params: {
        owner: string;
        repo: string;
        comment_id: number;
        body: string;
      }) => Promise<unknown>;
    };
  };
}

export interface IssueModeDeps {
  core: typeof core;
  context: {
    payload: IssueContextPayload;
    repo: {
      owner: string;
      repo: string;
    };
  };
  octokit: OctokitLike;
}

export function buildCommentBody(report: Report): string {
  const sections: string[] = [MARKER, formatMarkdown(report)];

  const complexity = report.meta?.suggestedComplexity;
  if (complexity) {
    sections.push(`**Suggested Complexity:** ${complexity}`);
  }

  sections.push(`---\n*Evaluated by WaveForge (waveforge-stellar v${WAVEFORGE_VERSION})*`);

  return sections.join("\n\n");
}

export async function findExistingComment(
  octokit: OctokitLike,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<number | undefined> {
  let page = 1;
  while (true) {
    const res = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
      page,
    });
    const comments = res.data || [];
    const found = comments.find((c) => c.body?.includes(MARKER));
    if (found) {
      return found.id;
    }
    if (comments.length < 100) {
      return undefined;
    }
    page++;
  }
}

export async function runIssueMode(
  inputs: ActionInputs,
  deps?: IssueModeDeps,
): Promise<Report | undefined> {
  const actualCore = deps?.core ?? core;
  const actualContext = deps?.context ?? github.context;

  const issue = actualContext.payload.issue;
  if (!issue || typeof issue.title !== "string") {
    actualCore.setFailed(
      'Issue payload missing from context. Expected an "issues" event with payload.issue containing title and body.',
    );
    return undefined;
  }

  const title = issue.title;
  const body = issue.body ?? "";

  const report = await runIssueLint(body, { title });

  // Outputs
  actualCore.setOutput("score", String(report.score));
  actualCore.setOutput(
    "suggested-complexity",
    report.meta?.suggestedComplexity ?? "",
  );
  actualCore.setOutput("report-json", formatJson(report));

  if (inputs.comment) {
    if (!inputs.githubToken && !deps?.octokit) {
      actualCore.setFailed("GitHub token is required to create or update issue comments.");
      return undefined;
    }

    const actualOctokit = deps?.octokit ?? github.getOctokit(inputs.githubToken);
    const { owner, repo } = actualContext.repo;
    const issueNumber = issue.number;
    if (!issueNumber) {
      actualCore.setFailed("Issue number missing from context payload.");
      return undefined;
    }

    const commentBody = buildCommentBody(report);
    const existingCommentId = await findExistingComment(
      actualOctokit,
      owner,
      repo,
      issueNumber,
    );

    if (existingCommentId !== undefined) {
      await actualOctokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingCommentId,
        body: commentBody,
      });
      actualCore.info(
        `Updated existing comment ${existingCommentId} on issue #${issueNumber}`,
      );
    } else {
      await actualOctokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: commentBody,
      });
      actualCore.info(`Created new comment on issue #${issueNumber}`);
    }
  }

  if (inputs.failOnLowScore && report.score < inputs.minScore) {
    actualCore.setFailed(
      `Readiness score ${report.score} is below the minimum threshold ${inputs.minScore}.`,
    );
  }

  return report;
}
