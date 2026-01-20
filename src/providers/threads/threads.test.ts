import { describe, test, expect, afterEach } from "bun:test";

import { Effect } from "effect";

import { mockFetch } from "../../test-utils";

import { threads } from "./threads";

describe("Threads provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken (not redirected to login)", async () => {
    const mockResponse = new Response("Profile page", { status: 200 });
    Object.defineProperty(mockResponse, "url", {
      value: "https://www.threads.com/@testuser",
    });

    globalThis.fetch = mockFetch(() => Promise.resolve(mockResponse));

    const result = await Effect.runPromise(threads.check("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (redirected to login)", async () => {
    const mockResponse = new Response("Login page", { status: 200 });
    Object.defineProperty(mockResponse, "url", {
      value: "https://www.threads.com/login/?next=...",
    });

    globalThis.fetch = mockFetch(() => Promise.resolve(mockResponse));

    const result = await Effect.runPromise(threads.check("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mockFetch(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      const mockResponse = new Response("Profile", { status: 200 });
      Object.defineProperty(mockResponse, "url", {
        value: "https://www.threads.com/@testuser",
      });
      return Promise.resolve(mockResponse);
    });

    const result = await Effect.runPromise(threads.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mockFetch(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(threads.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with @ prefix", async () => {
    let calledUrl = "";
    const mockResponse = new Response("", { status: 200 });
    Object.defineProperty(mockResponse, "url", {
      value: "https://www.threads.com/@myusername",
    });

    globalThis.fetch = mockFetch((input: RequestInfo | URL) => {
      calledUrl = String(input);
      return Promise.resolve(mockResponse);
    });

    await Effect.runPromise(threads.check("myusername"));
    expect(calledUrl).toBe("https://threads.com/@myusername");
  });

  test("profileUrl generates correct URL", () => {
    expect(threads.profileUrl("testuser")).toBe("https://threads.com/@testuser");
  });

  test("parseUrl extracts username from Threads URL", () => {
    expect(threads.parseUrl("https://threads.com/@testuser")).toBe("testuser");
    expect(threads.parseUrl("https://www.threads.com/@TestUser")).toBe("testuser");
    // Also support threads.net URLs (they redirect to threads.com)
    expect(threads.parseUrl("https://threads.net/@testuser")).toBe("testuser");
  });

  test("parseUrl returns null for non-Threads URL", () => {
    expect(threads.parseUrl("https://instagram.com/testuser")).toBeNull();
  });
});
