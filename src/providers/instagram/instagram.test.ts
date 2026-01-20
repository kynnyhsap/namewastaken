import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { checkInstagram } from "./instagram";

describe("Instagram provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns true when username is taken", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(`some content {"username":"testuser"} more content`))
    );

    const result = await Effect.runPromise(checkInstagram("testuser"));
    expect(result).toBe(true);
  });

  test("returns false when username is available", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Page not found"))
    );

    const result = await Effect.runPromise(checkInstagram("testuser"));
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

    const result = await Effect.runPromise(checkInstagram("testuser"));
    expect(result).toBe(true);
    expect(attempts).toBe(3);
  });

  test("fails after max retries", async () => {
    globalThis.fetch = mock(() => {
      return Promise.reject(new Error("Network error"));
    });

    const result = await Effect.runPromiseExit(checkInstagram("testuser"));
    expect(result._tag).toBe("Failure");
  });

  test("calls correct URL", async () => {
    let calledUrl = "";
    globalThis.fetch = mock((url: string) => {
      calledUrl = url;
      return Promise.resolve(new Response(""));
    });

    await Effect.runPromise(checkInstagram("myusername"));
    expect(calledUrl).toBe("https://www.instagram.com/myusername");
  });
});
