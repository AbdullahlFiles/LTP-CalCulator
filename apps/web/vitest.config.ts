import { defineConfig } from "vitest/config";

export default defineConfig({
  // These tests are plain TypeScript (no React/CSS involved), but Vite's
  // config resolution still tries to load the project's postcss.config.mjs
  // by default. Tailwind v4's postcss export shape isn't compatible with
  // generic postcss-load-config consumers (this is a Tailwind v4 +
  // non-Next tooling friction point, not specific to this project) —
  // short-circuiting CSS processing avoids it since these tests never
  // need it.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
