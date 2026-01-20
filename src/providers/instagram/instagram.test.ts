import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { instagram } from "./instagram";

describe("Instagram provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(`some content {"username":"testuser"} more content`)),
    );

    const result = await Effect.runPromise(instagram.check("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available", async () => {
    globalThis.fetch = mock(() => Promise.resolve(new Response("Page not found")));

    const result = await Effect.runPromise(instagram.check("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response(`{"username":"testuser"}`));
    });

    const result = await Effect.runPromise(instagram.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mock(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(instagram.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL", async () => {
    let calledUrl = "";
    globalThis.fetch = mock((url: string) => {
      calledUrl = url;
      return Promise.resolve(new Response(""));
    });

    await Effect.runPromise(instagram.check("myusername"));
    expect(calledUrl).toBe("https://www.instagram.com/myusername");
  });

  test("profileUrl generates correct URL", () => {
    expect(instagram.profileUrl("testuser")).toBe("https://instagram.com/testuser");
  });

  test("parseUrl extracts username from Instagram URL", () => {
    expect(instagram.parseUrl("https://instagram.com/testuser")).toBe("testuser");
    expect(instagram.parseUrl("https://www.instagram.com/TestUser")).toBe("testuser");
  });

  test("parseUrl returns null for non-Instagram URL", () => {
    expect(instagram.parseUrl("https://tiktok.com/@testuser")).toBeNull();
  });
});
