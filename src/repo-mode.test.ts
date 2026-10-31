import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";
import type * as core from "@actions/core";
import { runRepoMode, parseFileLine, type RepoModeDeps } from "./repo-mode.js";
import type { ActionInputs } from "./inputs.js";
import type { Report } from "waveforge-stellar";

describe("parseFileLine", () => {
  it("parses path and line number", () => {
    expect(parseFileLine("src/lib.rs:42")).toEqual({
      file: "src/lib.rs",
      line: 42,
    });
  });

  it("parses path, line, and column", () => {
    expect(parseFileLine("contracts/token/src/lib.rs:15:8")).toEqual({
      file: "contracts/token/src/lib.rs",
      line: 15,
    });
  });

  it("returns null when no line number is present", () => {
    expect(parseFileLine("README.md")).toBeNull();
    expect(parseFileLine("missing file path")).toBeNull();
  });
});

describe("runRepoMode", () => {
  let summaryContent: string;
  let mockSummary: {
    addRaw: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
  };
  let mockCore: {
    setFailed: ReturnType<typeof vi.fn>;
    setOutput: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    summary: typeof mockSummary;
  };

  let defaultInputs: ActionInputs;
  let workspaceRoot: string;

  beforeEach(() => {
    summaryContent = "";
    mockSummary = {
      addRaw: vi.fn().mockImplementation((text: string) => {
        summaryContent += text;
        return mockSummary;
      }),
      write: vi.fn().mockResolvedValue(mockSummary),
    };

    mockCore = {
      setFailed: vi.fn(),
      setOutput: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      summary: mockSummary,
    };

    workspaceRoot = resolve(import.meta.dirname, "..");

    defaultInputs = {
      mode: "repo",
      minScore: 70,
      network: "testnet",
      rpcUrl: undefined,
      offline: true,
      comment: true,
      failOnLowScore: false,
      githubToken: "ghp_dummy_token",
    };
  });

  it("fails clearly if GITHUB_WORKSPACE is missing", async () => {
    const originalEnv = process.env.GITHUB_WORKSPACE;
    delete process.env.GITHUB_WORKSPACE;

    try {
      const deps: RepoModeDeps = {
        core: mockCore as unknown as typeof core,
      };

      await runRepoMode(defaultInputs, deps);

      expect(mockCore.setFailed).toHaveBeenCalledWith(
        expect.stringContaining("GITHUB_WORKSPACE environment variable is missing"),
      );
    } finally {
      if (originalEnv !== undefined) {
        process.env.GITHUB_WORKSPACE = originalEnv;
      }
    }
  });

  it("writes summary and sets outputs using fixture workspace folder", async () => {
    const deps: RepoModeDeps = {
      core: mockCore as unknown as typeof core,
      workspaceRoot,
    };

    const report = await runRepoMode(defaultInputs, deps);

    expect(report).toBeDefined();
    expect(mockSummary.addRaw).toHaveBeenCalled();
    expect(mockSummary.write).toHaveBeenCalled();
    expect(summaryContent).toContain("WaveForge");

    expect(mockCore.setOutput).toHaveBeenCalledWith("score", expect.any(String));
    expect(mockCore.setOutput).toHaveBeenCalledWith("report-json", expect.any(String));
  });

  it("passes offline skips through as skipped", async () => {
    const deps: RepoModeDeps = {
      core: mockCore as unknown as typeof core,
      workspaceRoot,
    };

    defaultInputs.offline = true;
    const report = await runRepoMode(defaultInputs, deps);

    expect(report).toBeDefined();
    const skippedChecks = report?.results.filter((r) => r.status === "skipped");
    expect(skippedChecks?.length).toBeGreaterThan(0);
    // Offline skipped checks must not cause failures on their own
    expect(skippedChecks?.some((r) => r.id === "R8")).toBe(true);
  });

  it("parses file:line evidence and emits annotations for fails and warnings", async () => {
    const mockReport: Report = {
      kind: "repo",
      target: "repo",
      score: 80,
      generatedAt: new Date().toISOString(),
      results: [
        {
          id: "R1",
          title: "License check",
          status: "fail",
          message: "License header missing in source file",
          evidence: ["contracts/counter/src/lib.rs:25"],
        },
        {
          id: "R2",
          title: "Documentation check",
          status: "warn",
          message: "README setup instructions incomplete",
          evidence: ["README.md:12:4"],
        },
        {
          id: "R3",
          title: "Build check",
          status: "pass",
          message: "Build ok",
        },
      ],
    };

    const deps: RepoModeDeps = {
      core: mockCore as unknown as typeof core,
      workspaceRoot,
      runRepoChecks: vi.fn().mockResolvedValue(mockReport),
    };

    await runRepoMode(defaultInputs, deps);

    expect(mockCore.error).toHaveBeenCalledWith("License header missing in source file", {
      file: "contracts/counter/src/lib.rs",
      startLine: 25,
      title: "R1: License check",
    });

    expect(mockCore.warning).toHaveBeenCalledWith("README setup instructions incomplete", {
      file: "README.md",
      startLine: 12,
      title: "R2: Documentation check",
    });
  });

  it("enforces failure rule: fails when any result is fail", async () => {
    const mockReport: Report = {
      kind: "repo",
      target: "repo",
      score: 95,
      generatedAt: new Date().toISOString(),
      results: [
        {
          id: "R1",
          title: "Critical check",
          status: "fail",
          message: "Check failed",
        },
      ],
    };

    const deps: RepoModeDeps = {
      core: mockCore as unknown as typeof core,
      workspaceRoot,
      runRepoChecks: vi.fn().mockResolvedValue(mockReport),
    };

    defaultInputs.failOnLowScore = false;
    await runRepoMode(defaultInputs, deps);

    expect(mockCore.setFailed).toHaveBeenCalledWith("One or more repository checks failed.");
  });

  it("enforces failure rule: fails when fail-on-low-score is true and score < min-score", async () => {
    const mockReport: Report = {
      kind: "repo",
      target: "repo",
      score: 50,
      generatedAt: new Date().toISOString(),
      results: [
        {
          id: "R1",
          title: "Warning check",
          status: "warn",
          message: "Some warning",
        },
      ],
    };

    const deps: RepoModeDeps = {
      core: mockCore as unknown as typeof core,
      workspaceRoot,
      runRepoChecks: vi.fn().mockResolvedValue(mockReport),
    };

    // 1. failOnLowScore: false -> does not fail
    defaultInputs.failOnLowScore = false;
    defaultInputs.minScore = 70;
    await runRepoMode(defaultInputs, deps);
    expect(mockCore.setFailed).not.toHaveBeenCalled();

    // 2. failOnLowScore: true -> fails
    defaultInputs.failOnLowScore = true;
    defaultInputs.minScore = 70;
    await runRepoMode(defaultInputs, deps);
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("Repository readiness score 50 is below the minimum threshold 70"),
    );
  });
});
