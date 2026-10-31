import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.strict,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.js",
            "tsup.config.ts",
            "scripts/local-run.mjs",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["dist/", "node_modules/", "coverage/"],
  },
);
