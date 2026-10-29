import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as core from "@actions/core";
import { runIssueMode, MARKER, WAVEFORGE_VERSION, type IssueModeDeps, type OctokitLike } from "./issue-mode.js";
import type { ActionInputs } from "./inputs.js";

describe("runIssueMode", () => {
  let mockCore: {
    setOutput: ReturnType<typeof vi.fn>;
    setFailed: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  let mockOctokit: {
    rest: {
      issues: {
        listComments: ReturnType<typeof vi.fn>;
        createComment: ReturnType<typeof vi.fn>;
        updateComment: ReturnType<typeof vi.fn>;
      };
    };
  };

  let mockDeps: IssueModeDeps;
  let defaultInputs: ActionInputs;

  beforeEach(() => {
    mockCore = {
      setOutput: vi.fn(),
      setFailed: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      debug: vi.fn(),
    };

    mockOctokit = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [] }),
          createComment: vi.fn().mockResolvedValue({ data: { id: 101 } }),
          updateComment: vi.fn().mockResolvedValue({ data: { id: 101 } }),
        },
      },
    };

    mockDeps = {
      core: mockCore as unknown as typeof core,
      context: {
        payload: {
          issue: {
            number: 42,
            title: "Implement multi-sig payment channel",
            body: [
              "## Description",
              "This issue adds multi-signature payment verification.",
              "## Requirements",
              "- Bullet 1",
              "## Done when",
              "- [ ] Checkbox 1",
              "- [ ] Checkbox 2",
              "## Files to touch",
              "- contracts/multisig/src/lib.rs",
              "## Suggested execution",
              "1. Step 1",
              "Complexity: High",
            ].join("\n"),
          },
        },
        repo: {
          owner: "test-owner",
          repo: "test-repo",
        },
      },
      octokit: mockOctokit as unknown as OctokitLike,
    };

    defaultInputs = {
      mode: "issue",
      minScore: 70,
      network: "testnet",
      rpcUrl: undefined,
      offline: false,
      comment: true,
      failOnLowScore: false,
      githubToken: "ghp_ultra_secret_test_token_9999",
    };
  });

  it("fails if issue payload is absent", async () => {
    mockDeps.context.payload = {};

    await runIssueMode(defaultInputs, mockDeps);

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("Issue payload missing from context"),
    );
  });

  it("creates once when no existing comment has the marker", async () => {
    mockOctokit.rest.issues.listComments.mockResolvedValueOnce({
      data: [
        { id: 1, body: "Just a regular comment from a user" },
        { id: 2, body: "Another comment without marker" },
      ],
    });

    await runIssueMode(defaultInputs, mockDeps);

    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();

    const firstCreateCall = mockOctokit.rest.issues.createComment.mock.calls[0];
    expect(firstCreateCall).toBeDefined();
    const createArgs = firstCreateCall?.[0] as {
      owner: string;
      repo: string;
      issue_number: number;
      body: string;
    };
    expect(createArgs.owner).toBe("test-owner");
    expect(createArgs.repo).toBe("test-repo");
    expect(createArgs.issue_number).toBe(42);
    expect(createArgs.body).toContain(MARKER);
    expect(createArgs.body).toContain(`*Evaluated by WaveForge (waveforge-stellar v${WAVEFORGE_VERSION})*`);
  });

  it("updates on second run (no duplicate) when existing comment has the marker", async () => {
    mockOctokit.rest.issues.listComments.mockResolvedValueOnce({
      data: [
        { id: 1, body: "A user comment" },
        { id: 99, body: `Previous review:\n${MARKER}\nOld report` },
      ],
    });

    await runIssueMode(defaultInputs, mockDeps);

    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledTimes(1);

    const firstUpdateCall = mockOctokit.rest.issues.updateComment.mock.calls[0];
    expect(firstUpdateCall).toBeDefined();
    const updateArgs = firstUpdateCall?.[0] as {
      owner: string;
      repo: string;
      comment_id: number;
      body: string;
    };
    expect(updateArgs.owner).toBe("test-owner");
    expect(updateArgs.repo).toBe("test-repo");
    expect(updateArgs.comment_id).toBe(99);
    expect(updateArgs.body).toContain(MARKER);
  });

  it("pagination finds the marker on page 2", async () => {
    const page1Comments = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      body: `Comment ${i + 1}`,
    }));
    const page2Comments = [
      { id: 205, body: `Some text\n${MARKER}\nWaveForge report` },
    ];

    mockOctokit.rest.issues.listComments
      .mockResolvedValueOnce({ data: page1Comments })
      .mockResolvedValueOnce({ data: page2Comments });

    await runIssueMode(defaultInputs, mockDeps);

    expect(mockOctokit.rest.issues.listComments).toHaveBeenCalledTimes(2);
    expect(mockOctokit.rest.issues.listComments).toHaveBeenNthCalledWith(1, {
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      per_page: 100,
      page: 1,
    });
    expect(mockOctokit.rest.issues.listComments).toHaveBeenNthCalledWith(2, {
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      per_page: 100,
      page: 2,
    });

    expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment_id: 205,
      }),
    );
    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("sets required action outputs (score, suggested-complexity, report-json)", async () => {
    await runIssueMode(defaultInputs, mockDeps);

    expect(mockCore.setOutput).toHaveBeenCalledWith("score", expect.any(String));
    expect(mockCore.setOutput).toHaveBeenCalledWith("suggested-complexity", expect.any(String));
    expect(mockCore.setOutput).toHaveBeenCalledWith("report-json", expect.any(String));

    const reportJsonCall = mockCore.setOutput.mock.calls.find(
      (c) => c[0] === "report-json",
    );
    expect(reportJsonCall).toBeDefined();
    const jsonStr = String(reportJsonCall?.[1]);
    const parsed = JSON.parse(jsonStr) as { kind: string; score: number };
    expect(parsed.kind).toBe("issue");
    expect(typeof parsed.score).toBe("number");
  });

  it("respects failure rule based on fail-on-low-score and min-score", async () => {
    defaultInputs.failOnLowScore = false;
    defaultInputs.minScore = 100;
    const issuePayload = mockDeps.context.payload.issue;
    if (issuePayload) {
      issuePayload.body = "minimal";
    }
    await runIssueMode(defaultInputs, mockDeps);
    expect(mockCore.setFailed).not.toHaveBeenCalled();

    defaultInputs.failOnLowScore = true;
    defaultInputs.minScore = 100;
    await runIssueMode(defaultInputs, mockDeps);
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("is below the minimum threshold 100"),
    );

    mockCore.setFailed.mockClear();
    defaultInputs.minScore = 0;
    await runIssueMode(defaultInputs, mockDeps);
    expect(mockCore.setFailed).not.toHaveBeenCalled();
  });

  it("does not comment when comment input is false", async () => {
    defaultInputs.comment = false;
    await runIssueMode(defaultInputs, mockDeps);

    expect(mockOctokit.rest.issues.listComments).not.toHaveBeenCalled();
    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
  });

  it("token never appears in logs", async () => {
    const secretToken = "ghp_ultra_secret_test_token_9999";
    defaultInputs.githubToken = secretToken;

    await runIssueMode(defaultInputs, mockDeps);

    const allCoreCalls = [
      ...mockCore.info.mock.calls,
      ...mockCore.error.mock.calls,
      ...mockCore.warning.mock.calls,
      ...mockCore.debug.mock.calls,
      ...mockCore.setFailed.mock.calls,
    ];

    for (const call of allCoreCalls) {
      const loggedText = JSON.stringify(call);
      expect(loggedText).not.toContain(secretToken);
    }
  });
});
