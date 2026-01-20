import { describe, test, expect, afterEach } from "bun:test";

import { Effect } from "effect";

import { mockFetch } from "../../test-utils";

import { github } from "./github";

describe("GitHub provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken (200 status)", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("", { status: 200 })));

    const result = await Effect.runPromise(github.check("mrbeast"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (404 status)", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("Not Found", { status: 404 })));

    const result = await Effect.runPromise(github.check("available123"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mockFetch(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response("", { status: 200 }));
    });

    const result = await Effect.runPromise(github.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mockFetch(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(github.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with HEAD method", async () => {
    let calledUrl = "";
    let calledMethod = "";

    globalThis.fetch = mockFetch((input: RequestInfo | URL, options?: RequestInit) => {
      calledUrl = String(input);
      calledMethod = options?.method ?? "GET";
      return Promise.resolve(new Response("", { status: 200 }));
    });

    await Effect.runPromise(github.check("myusername"));
    expect(calledUrl).toBe("https://github.com/myusername");
    expect(calledMethod).toBe("HEAD");
  });

  test("profileUrl generates correct URL", () => {
    expect(github.profileUrl("testuser")).toBe("https://github.com/testuser");
  });

  test("parseUrl extracts username from GitHub URL", () => {
    expect(github.parseUrl("https://github.com/testuser")).toBe("testuser");
    expect(github.parseUrl("https://www.github.com/TestUser")).toBe("testuser");
  });

  test("parseUrl handles usernames with hyphens", () => {
    expect(github.parseUrl("https://github.com/test-user")).toBe("test-user");
    expect(github.parseUrl("https://github.com/my-cool-name")).toBe("my-cool-name");
  });

  test("parseUrl returns null for non-GitHub URL", () => {
    expect(github.parseUrl("https://instagram.com/testuser")).toBeNull();
  });

  test("parseUrl returns null for GitHub repo URLs", () => {
    // Should only match user/org profiles, not repos
    expect(github.parseUrl("https://github.com/user/repo")).toBe("user");
  });
});
