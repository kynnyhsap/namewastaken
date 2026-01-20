import { describe, test, expect } from "bun:test";

import { Effect } from "effect";

import { AVAILABLE_USERNAME } from "../../test-utils";

import { threads } from "./threads";

// Integration tests - make real HTTP requests
// Run with: bun test:e2e

const KNOWN_TAKEN = "mrbeast";

describe("Threads provider (e2e)", () => {
  test("detects taken username", async () => {
    const result = await Effect.runPromise(threads.check(KNOWN_TAKEN));
    expect(result).toBe(true);
  }, 15000);

  test("detects available username", async () => {
    const result = await Effect.runPromise(threads.check(AVAILABLE_USERNAME));
    expect(result).toBe(false);
  }, 15000);
});
