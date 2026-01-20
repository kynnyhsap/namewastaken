import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { tiktok } from "./tiktok";

describe("TikTok provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(`some content "desc":"@testuser more content`)),
    );

    const result = await Effect.runPromise(tiktok.check("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available", async () => {
    globalThis.fetch = mock(() => Promise.resolve(new Response("Page not found - no user here")));

    const result = await Effect.runPromise(tiktok.check("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response(`"desc":"@testuser`));
    });

    const result = await Effect.runPromise(tiktok.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mock(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(tiktok.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with @ prefix", async () => {
    let calledUrl = "";
    globalThis.fetch = mock((url: string) => {
      calledUrl = url;
      return Promise.resolve(new Response(""));
    });

    await Effect.runPromise(tiktok.check("myusername"));
    expect(calledUrl).toBe("https://tiktok.com/@myusername");
  });

  test("profileUrl generates correct URL", () => {
    expect(tiktok.profileUrl("testuser")).toBe("https://tiktok.com/@testuser");
  });

  test("parseUrl extracts username from TikTok URL", () => {
    expect(tiktok.parseUrl("https://tiktok.com/@testuser")).toBe("testuser");
    expect(tiktok.parseUrl("https://www.tiktok.com/@TestUser")).toBe("testuser");
  });

  test("parseUrl returns null for non-TikTok URL", () => {
    expect(tiktok.parseUrl("https://instagram.com/testuser")).toBeNull();
  });
});
