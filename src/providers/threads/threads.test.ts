import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { checkThreads } from "./threads";

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

    globalThis.fetch = mock(() => Promise.resolve(mockResponse));

    const result = await Effect.runPromise(checkThreads("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available (redirected to login)", async () => {
    const mockResponse = new Response("Login page", { status: 200 });
    Object.defineProperty(mockResponse, "url", {
      value: "https://www.threads.com/login/?next=...",
    });

    globalThis.fetch = mock(() => Promise.resolve(mockResponse));

    const result = await Effect.runPromise(checkThreads("testuser"));
    expect(result).toBe(false);
  });

  test("retries on network failure and succeeds", async () => {
    let attempts = 0;
    globalThis.fetch = mock(() => {
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

    const result = await Effect.runPromise(checkThreads("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mock(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(checkThreads("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL with @ prefix", async () => {
    let calledUrl = "";
    const mockResponse = new Response("", { status: 200 });
    Object.defineProperty(mockResponse, "url", {
      value: "https://www.threads.com/@myusername",
    });

    globalThis.fetch = mock((url: string) => {
      calledUrl = url;
      return Promise.resolve(mockResponse);
    });

    await Effect.runPromise(checkThreads("myusername"));
    expect(calledUrl).toBe("https://www.threads.com/@myusername");
  });
});
