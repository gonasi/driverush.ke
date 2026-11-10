import { defineConfig } from "vitest/config";

// Unit tests for pure logic only (the board's rules). Kept apart from
// `vite.config.ts` so the React Router plugin never loads under test.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ["app/**/*.test.ts"], environment: "node" },
});
