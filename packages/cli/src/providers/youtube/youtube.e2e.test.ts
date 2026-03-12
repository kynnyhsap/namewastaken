import { describe, test, expect } from "bun:test";

import { Effect } from "effect";

import { AVAILABLE_USERNAME } from "../../test-utils";

import { youtube } from "./youtube";

// Integration tests - make real HTTP requests
// Run with: bun test:e2e

const KNOWN_TAKEN = "mrbeast";

describe("YouTube provider (e2e)", () => {
  test("detects taken username", async () => {
    const result = await Effect.runPromise(youtube.check(KNOWN_TAKEN));
    expect(result).toBe(true);
  }, 15000);

  test("detects available username", async () => {
    const result = await Effect.runPromise(youtube.check(AVAILABLE_USERNAME));
    expect(result).toBe(false);
  }, 15000);
});
