import { describe, test, expect } from "bun:test";

import { Effect } from "effect";

import { AVAILABLE_USERNAME } from "../../test-utils";

import { x } from "./x";

// Integration tests - make real HTTP requests

const KNOWN_TAKEN = "mrbeast";

describe("X/Twitter provider (e2e)", () => {
  test("detects taken username", async () => {
    const result = await Effect.runPromise(x.check(KNOWN_TAKEN));
    expect(result).toBe(true);
  }, 15000);

  test("detects available username", async () => {
    const result = await Effect.runPromise(x.check(AVAILABLE_USERNAME));
    expect(result).toBe(false);
  }, 15000);
});
