import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import", "typescript"],
  categories: {
    correctness: "warn",
  },
  ignorePatterns: [
    "app/**",
    "**/node_modules",
    "**/dist",
    "**/build",
    "**/.expo",
    "**/bun.lock",
    "**/package-lock.json",
    "**/*.tsbuildinfo",
  ],
});
