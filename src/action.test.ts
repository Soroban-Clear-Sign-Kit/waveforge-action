import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
import { resolve } from "node:path";

describe("action.yml", () => {
  const actionPath = resolve(import.meta.dirname, "..", "action.yml");
  const raw = readFileSync(actionPath, "utf8");
  const action = parse(raw) as Record<string, unknown>;

  it("parses as valid YAML", () => {
    expect(action).toBeDefined();
    expect(typeof action).toBe("object");
  });

  it("has required top-level fields", () => {
    expect(action["name"]).toBe("WaveForge");
    expect(action["description"]).toBeTruthy();
    expect(action["runs"]).toBeDefined();
  });

  it("uses node20 runtime", () => {
    const runs = action["runs"] as Record<string, unknown>;
    expect(runs["using"]).toBe("node20");
  });

  it("main file exists on disk", () => {
    const runs = action["runs"] as Record<string, unknown>;
    const mainFile = runs["main"] as string;
    const mainPath = resolve(import.meta.dirname, "..", mainFile);
    expect(existsSync(mainPath)).toBe(true);
  });
});

describe("ci.yml", () => {
  const ciPath = resolve(import.meta.dirname, "..", ".github", "workflows", "ci.yml");
  const raw = readFileSync(ciPath, "utf8");
  const ci = parse(raw) as Record<string, unknown>;

  it("parses as valid YAML", () => {
    expect(ci).toBeDefined();
    expect(typeof ci).toBe("object");
  });

  it("triggers on pull_request and push to main", () => {
    const on = ci["on"] as Record<string, unknown>;
    expect(on).toBeDefined();
    expect(on["pull_request"]).toBeDefined();
    const push = on["push"] as Record<string, unknown>;
    expect(push).toBeDefined();
    expect(push["branches"]).toEqual(["main"]);
  });

  it("defines CI job with Node 20 and dist check", () => {
    const jobs = ci["jobs"] as Record<string, unknown>;
    expect(jobs["ci"]).toBeDefined();
    const ciJob = jobs["ci"] as Record<string, unknown>;
    expect(ciJob["runs-on"]).toBe("ubuntu-latest");

    const steps = ciJob["steps"] as Array<Record<string, unknown>>;
    expect(steps.length).toBeGreaterThan(0);

    const stepRuns = steps.map((s) => s["run"] || s["uses"]);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("actions/checkout"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("pnpm/action-setup"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("actions/setup-node"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("--frozen-lockfile"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("pnpm lint"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("pnpm typecheck"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("pnpm test"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("pnpm build"))).toBe(true);
    expect(stepRuns.some((r) => typeof r === "string" && r.includes("git diff --exit-code -- dist/"))).toBe(true);
  });
});
