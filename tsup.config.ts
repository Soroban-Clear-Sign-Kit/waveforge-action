import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  platform: "node",
  target: "node20",
  format: ["esm"],
  outDir: "dist",
  noExternal: [/.*/],
  clean: true,
  dts: false,
  banner: {
    js: `import { createRequire } from "node:module"; const require = createRequire(import.meta.url);`,
  },
});
