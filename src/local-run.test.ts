import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type * as core from "@actions/core";
import { runIssueMode, type IssueContextPayload, type OctokitLike } from "./issue-mode.js";

const repoRoot = resolve(import.meta.dirname, "..");
const issueEventPath = resolve(repoRoot, "examples", "events", "issue-opened.json");

describe("examples/events/issue-opened.json", () => {
  it("exists and contains a realistic GitHub issues opened payload", () => {
    expect(existsSync(issueEventPath)).toBe(true);
    const raw = readFileSync(issueEventPath, "utf8");
    const parsed = JSON.parse(raw) as {
      action?: string;
      issue?: { number?: number; title?: string; body?: string };
      repository?: { name?: string; owner?: { login?: string } };
    };

    expect(parsed.action).toBe("opened");
    expect(typeof parsed.issue?.number).toBe("number");
    expect(parsed.issue?.title).toBeTruthy();
    expect(parsed.issue?.body).toContain("## Description");
    expect(parsed.issue?.body).toContain("## Done when");
    expect(parsed.repository?.name).toBeTruthy();
    expect(parsed.repository?.owner?.login).toBeTruthy();
  });

  it("produces a valid issue lint report in runIssueMode with comment=false", async () => {
    const payload = JSON.parse(readFileSync(issueEventPath, "utf8")) as IssueContextPayload & {
      repository: { name: string; owner: { login: string } };
    };

    const mockCore = {
      setOutput: vi.fn(),
      setFailed: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      debug: vi.fn(),
    };

    const report = await runIssueMode(
      {
        mode: "issue",
        minScore: 70,
        network: "testnet",
        rpcUrl: undefined,
        offline: false,
        comment: false,
        failOnLowScore: true,
        githubToken: "",
      },
      {
        core: mockCore as unknown as typeof core,
        context: {
          payload,
          repo: {
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
          },
        },
        octokit: {} as OctokitLike,
      },
    );

    expect(report).toBeDefined();
    expect(report?.kind).toBe("issue");
    expect(report?.score).toBeGreaterThanOrEqual(70);
    expect(mockCore.setFailed).not.toHaveBeenCalled();
  });
});
