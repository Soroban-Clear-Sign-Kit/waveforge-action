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

describe("issue forms & templates", () => {
  const templatesDir = resolve(import.meta.dirname, "..", ".github", "ISSUE_TEMPLATE");

  it("parses bug.yml with valid GitHub schema", () => {
    const raw = readFileSync(resolve(templatesDir, "bug.yml"), "utf8");
    const bug = parse(raw) as Record<string, unknown>;
    expect(bug["name"]).toBeTruthy();
    expect(bug["description"]).toBeTruthy();
    expect(bug["labels"]).toContain("bug");
    const body = bug["body"] as Array<Record<string, unknown>>;
    const ids = body.map((item) => item["id"]);
    expect(ids).toContain("what-happened");
    expect(ids).toContain("expected-behaviour");
    expect(ids).toContain("steps-to-reproduce");
    expect(ids).toContain("version");
  });

  it("parses feature.yml with required done-when checklist", () => {
    const raw = readFileSync(resolve(templatesDir, "feature.yml"), "utf8");
    const feature = parse(raw) as Record<string, unknown>;
    expect(feature["name"]).toBeTruthy();
    expect(feature["description"]).toBeTruthy();
    expect(feature["labels"]).toContain("enhancement");
    const body = feature["body"] as Array<Record<string, unknown>>;
    const ids = body.map((item) => item["id"]);
    expect(ids).toContain("problem");
    expect(ids).toContain("proposed-solution");
    expect(ids).toContain("done-when");
    expect(ids).toContain("files-to-touch");

    const doneWhen = body.find((item) => item["id"] === "done-when");
    expect(doneWhen).toBeDefined();
    expect(doneWhen?.["type"]).toBe("checkboxes");
    const validations = doneWhen?.["validations"] as Record<string, unknown> | undefined;
    expect(validations?.["required"]).toBe(true);
  });

  it("parses spike.yml with required question, investigate, output", () => {
    const raw = readFileSync(resolve(templatesDir, "spike.yml"), "utf8");
    const spike = parse(raw) as Record<string, unknown>;
    expect(spike["name"]).toBeTruthy();
    expect(spike["description"]).toBeTruthy();
    expect(spike["labels"]).toContain("spike");
    const body = spike["body"] as Array<Record<string, unknown>>;
    const ids = body.map((item) => item["id"]);
    expect(ids).toContain("question-to-answer");
    expect(ids).toContain("what-to-investigate");
    expect(ids).toContain("expected-output");
  });

  it("parses config.yml with blank_issues_enabled: false", () => {
    const raw = readFileSync(resolve(templatesDir, "config.yml"), "utf8");
    const config = parse(raw) as Record<string, unknown>;
    expect(config["blank_issues_enabled"]).toBe(false);
  });

  it("PR template exists and contains required sections", () => {
    const prTemplatePath = resolve(import.meta.dirname, "..", ".github", "pull_request_template.md");
    const raw = readFileSync(prTemplatePath, "utf8");
    expect(raw).toContain("Closes #");
    expect(raw).toContain("Summary");
    expect(raw).toContain("Test Evidence");
    expect(raw).toContain("Checklist");
  });
});
