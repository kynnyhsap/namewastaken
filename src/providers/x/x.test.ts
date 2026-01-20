import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { checkX } from "./x";

describe("X/Twitter provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Profile page content"))
    );

    const result = await Effect.runPromise(checkX("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (account doesn't exist)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("This account doesn't exist"))
    );

    const result = await Effect.runPromise(checkX("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response("Profile page"));
    });

    const result = await Effect.runPromise(checkX("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mock(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(checkX("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with user-agent header", async () => {
    let calledUrl = "";
    let calledHeaders: Record<string, string> = {};

    globalThis.fetch = mock((url: string, options?: RequestInit) => {
      calledUrl = url;
      calledHeaders = (options?.headers as Record<string, string>) ?? {};
      return Promise.resolve(new Response(""));
    });

    await Effect.runPromise(checkX("myusername"));
    expect(calledUrl).toBe("https://x.com/myusername");
    expect(calledHeaders["User-Agent"]).toBeDefined();
  });
});
