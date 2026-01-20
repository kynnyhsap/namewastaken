import { describe, test, expect, afterEach } from "bun:test";

import { Effect } from "effect";

import { mockFetch } from "../../test-utils";

import { telegram } from "./telegram";

describe("Telegram provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken (View title)", async () => {
    globalThis.fetch = mockFetch(() =>
      Promise.resolve(new Response("<title>Telegram: View @mrbeast</title>")),
    );

    const result = await Effect.runPromise(telegram.check("mrbeast"));
    expect(result).toBe(true);
  });

  test("returns true when username is taken (channel/user name in title)", async () => {
    globalThis.fetch = mockFetch(() => Promise.resolve(new Response("<title>MrBeast</title>")));

    const result = await Effect.runPromise(telegram.check("mrbeast"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (Contact title)", async () => {
    globalThis.fetch = mockFetch(() =>
      Promise.resolve(new Response("<title>Telegram: Contact @available123</title>")),
    );

    const result = await Effect.runPromise(telegram.check("available123"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mockFetch(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(new Response("<title>Telegram: View @testuser</title>"));
    });

    const result = await Effect.runPromise(telegram.check("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mockFetch(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(telegram.check("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with user-agent header", async () => {
    let calledUrl = "";
    let calledHeaders: Record<string, string> = {};

    globalThis.fetch = mockFetch((input: RequestInfo | URL, options?: RequestInit) => {
      calledUrl = String(input);
      calledHeaders = (options?.headers as Record<string, string>) ?? {};
      return Promise.resolve(new Response("<title>Telegram: Contact @myusername</title>"));
    });

    await Effect.runPromise(telegram.check("myusername"));
    expect(calledUrl).toBe("https://t.me/myusername");
    expect(calledHeaders["User-Agent"]).toBe("curl/7.79.1");
  });

  test("profileUrl generates correct URL", () => {
    expect(telegram.profileUrl("testuser")).toBe("https://t.me/testuser");
  });

  test("parseUrl extracts username from t.me URL", () => {
    expect(telegram.parseUrl("https://t.me/testuser")).toBe("testuser");
    expect(telegram.parseUrl("https://www.t.me/TestUser")).toBe("testuser");
  });

  test("parseUrl extracts username from telegram.me URL", () => {
    expect(telegram.parseUrl("https://telegram.me/testuser")).toBe("testuser");
    expect(telegram.parseUrl("https://www.telegram.me/TestUser")).toBe("testuser");
  });

  test("parseUrl returns null for non-Telegram URL", () => {
    expect(telegram.parseUrl("https://instagram.com/testuser")).toBeNull();
  });
});
