import { describe, test, expect, afterEach } from "bun:test";

import { Effect } from "effect";

import { mockFetch } from "../../test-utils";

import { facebook } from "./facebook";

describe("Facebook provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken", async () => {
    globalThis.fetch = mockFetch(() =>
      Promise.resolve(new Response(`some facebook profile content`)),
    );

    const result = await Effect.runPromise(facebook.check("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (Page Not Found)", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("Page Not Found")));

    const result = await Effect.runPromise(facebook.check("testuser"));
    expect(result).toBe(false);
  });

  test("returns false when page isn't available", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("This page isn't available")));

    const result = await Effect.runPromise(facebook.check("testuser"));
    expect(result).toBe(false);
  });

  test("returns false when content isn't available", async () => {
    globalThis.fetch = mockFetch(() =>
      Promise.resolve(new Response("This content isn't available")),
    );

    const result = await Effect.runPromise(facebook.check("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mockFetch(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response(`facebook profile`));
    });

    const result = await Effect.runPromise(facebook.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mockFetch(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(facebook.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL", async () => {
    let calledUrl = "";
    globalThis.fetch = mockFetch((input: RequestInfo | URL) => {
      calledUrl = String(input);
      return Promise.resolve(new Response(""));
    });

    await Effect.runPromise(facebook.check("myusername"));
    expect(calledUrl).toBe("https://www.facebook.com/myusername");
  });

  test("profileUrl generates correct URL", () => {
    expect(facebook.profileUrl("testuser")).toBe("https://facebook.com/testuser");
  });

  test("parseUrl extracts username from Facebook URL", () => {
    expect(facebook.parseUrl("https://facebook.com/testuser")).toBe("testuser");
    expect(facebook.parseUrl("https://www.facebook.com/TestUser")).toBe("testuser");
  });

  test("parseUrl returns null for non-Facebook URL", () => {
    expect(facebook.parseUrl("https://instagram.com/testuser")).toBeNull();
  });
});
