import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { youtube } from "./youtube";

describe("YouTube provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken (status 200)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Channel page", { status: 200 }))
    );

    const result = await Effect.runPromise(youtube.check("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (status 404)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Not found", { status: 404 }))
    );

    const result = await Effect.runPromise(youtube.check("testuser"));
    expect(result).toBe(false);
  });

  test("returns true for other status codes (302 redirect, etc)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("", { status: 302 }))
    );

    const result = await Effect.runPromise(youtube.check("testuser"));
    expect(result).toBe(true);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response("Channel", { status: 200 }));
    });

    const result = await Effect.runPromise(youtube.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mock(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(youtube.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with @ prefix", async () => {
    let calledUrl = "";
    globalThis.fetch = mock((url: string) => {
      calledUrl = url;
      return Promise.resolve(new Response("", { status: 200 }));
    });

    await Effect.runPromise(youtube.check("myusername"));
    expect(calledUrl).toBe("https://www.youtube.com/@myusername");
  });

  test("profileUrl generates correct URL", () => {
    expect(youtube.profileUrl("testuser")).toBe("https://youtube.com/@testuser");
  });

  test("parseUrl extracts username from YouTube URL", () => {
    expect(youtube.parseUrl("https://youtube.com/@testuser")).toBe("testuser");
    expect(youtube.parseUrl("https://www.youtube.com/@TestUser")).toBe("testuser");
  });

  test("parseUrl returns null for non-YouTube URL", () => {
    expect(youtube.parseUrl("https://instagram.com/testuser")).toBeNull();
  });
});
