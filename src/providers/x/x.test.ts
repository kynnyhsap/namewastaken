import { describe, test, expect, afterEach } from "bun:test";
import { Effect } from "effect";
import { x } from "./x";
import { mockFetch } from "../../test-utils";

describe("X/Twitter provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("Profile page content")));

    const result = await Effect.runPromise(x.check("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (account doesn't exist)", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("This account doesn't exist")));

    const result = await Effect.runPromise(x.check("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mockFetch(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response("Profile page"));
    });

    const result = await Effect.runPromise(x.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mockFetch(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(x.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with user-agent header", async () => {
    let calledUrl = "";
    let calledHeaders: Record<string, string> = {};

    globalThis.fetch = mockFetch((input: RequestInfo | URL, options?: RequestInit) => {
      calledUrl = String(input);
      calledHeaders = (options?.headers as Record<string, string>) ?? {};
      return Promise.resolve(new Response(""));
    });

    await Effect.runPromise(x.check("myusername"));
    expect(calledUrl).toBe("https://x.com/myusername");
    expect(calledHeaders["User-Agent"]).toBeDefined();
  });

  test("profileUrl generates correct URL", () => {
    expect(x.profileUrl("testuser")).toBe("https://x.com/testuser");
  });

  test("parseUrl extracts username from X URL", () => {
    expect(x.parseUrl("https://x.com/testuser")).toBe("testuser");
    expect(x.parseUrl("https://www.x.com/TestUser")).toBe("testuser");
  });

  test("parseUrl extracts username from Twitter URL", () => {
    expect(x.parseUrl("https://twitter.com/testuser")).toBe("testuser");
    expect(x.parseUrl("https://www.twitter.com/TestUser")).toBe("testuser");
  });

  test("parseUrl returns null for non-X/Twitter URL", () => {
    expect(x.parseUrl("https://instagram.com/testuser")).toBeNull();
  });
});
