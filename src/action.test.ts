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
