import { describe, it, expect, vi, beforeEach } from "vitest";
import * as core from "@actions/core";
import { readInputs } from "./inputs.js";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
  getBooleanInput: vi.fn(),
  setFailed: vi.fn(),
  setSecret: vi.fn(),
  info: vi.fn(),
}));

describe("readInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads defaults when inputs are empty", () => {
    vi.mocked(core.getInput).mockReturnValue("");

    const inputs = readInputs();

    expect(inputs).toEqual({
      mode: "issue",
      minScore: 70,
      network: "testnet",
      rpcUrl: undefined,
      offline: false,
      comment: true,
      failOnLowScore: false,
      githubToken: "",
    });
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("fails with invalid mode", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "mode") return "invalid-mode";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).toBeNull();
    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid mode: "invalid-mode". Must be "issue" or "repo".',
    );
  });

  it("fails with min-score below 0", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "min-score") return "-5";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).toBeNull();
    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid min-score: "-5". Must be an integer between 0 and 100.',
    );
  });

  it("fails with min-score above 100", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "min-score") return "105";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).toBeNull();
    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid min-score: "105". Must be an integer between 0 and 100.',
    );
  });

  it("fails with non-numeric min-score", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "min-score") return "high";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).toBeNull();
    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid min-score: "high". Must be an integer between 0 and 100.',
    );
  });

  it("fails with invalid network enum", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "network") return "devnet";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).toBeNull();
    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid network: "devnet". Must be "testnet" or "mainnet".',
    );
  });

  it("fails when mainnet is specified without rpc-url", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "network") return "mainnet";
      if (name === "rpc-url") return "";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).toBeNull();
    expect(core.setFailed).toHaveBeenCalledWith(
      'Network "mainnet" requires an explicit "rpc-url" input.',
    );
  });

  it("succeeds when mainnet is specified with rpc-url", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "network") return "mainnet";
      if (name === "rpc-url") return "https://soroban-mainnet.example.com";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).not.toBeNull();
    expect(inputs?.network).toBe("mainnet");
    expect(inputs?.rpcUrl).toBe("https://soroban-mainnet.example.com");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("masks github-token when provided", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "github-token") return "ghp_secret_token_value";
      return "";
    });

    const inputs = readInputs();

    expect(inputs).not.toBeNull();
    expect(inputs?.githubToken).toBe("ghp_secret_token_value");
    expect(core.setSecret).toHaveBeenCalledWith("ghp_secret_token_value");
  });

  it("parses custom valid boolean and string inputs", () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "mode") return "repo";
      if (name === "min-score") return "85";
      if (name === "offline") return "true";
      if (name === "comment") return "false";
      if (name === "fail-on-low-score") return "true";
      return "";
    });
    vi.mocked(core.getBooleanInput).mockImplementation((name) => {
      if (name === "offline") return true;
      if (name === "comment") return false;
      if (name === "fail-on-low-score") return true;
      return false;
    });

    const inputs = readInputs();

    expect(inputs).toEqual({
      mode: "repo",
      minScore: 85,
      network: "testnet",
      rpcUrl: undefined,
      offline: true,
      comment: false,
      failOnLowScore: true,
      githubToken: "",
    });
    expect(core.setFailed).not.toHaveBeenCalled();
  });
});
