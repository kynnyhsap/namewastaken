import { describe, test, expect } from "bun:test";

import { parseUrl, isUrl, tiktok, instagram, x, threads, youtube } from "../providers";

describe("URL parser", () => {
  describe("parseUrl", () => {
    test("parses TikTok URL", () => {
      const result = parseUrl("https://tiktok.com/@username");
      expect(result?.provider).toBe(tiktok);
      expect(result?.username).toBe("username");
    });

    test("parses TikTok URL with www", () => {
      const result = parseUrl("https://www.tiktok.com/@testuser");
      expect(result?.provider).toBe(tiktok);
      expect(result?.username).toBe("testuser");
    });

    test("parses Instagram URL", () => {
      const result = parseUrl("https://instagram.com/username");
      expect(result?.provider).toBe(instagram);
      expect(result?.username).toBe("username");
    });

    test("parses Instagram URL with www", () => {
      const result = parseUrl("https://www.instagram.com/testuser");
      expect(result?.provider).toBe(instagram);
      expect(result?.username).toBe("testuser");
    });

    test("parses X URL", () => {
      const result = parseUrl("https://x.com/username");
      expect(result?.provider).toBe(x);
      expect(result?.username).toBe("username");
    });

    test("parses Twitter URL (alias for X)", () => {
      const result = parseUrl("https://twitter.com/username");
      expect(result?.provider).toBe(x);
      expect(result?.username).toBe("username");
    });

    test("parses Threads URL", () => {
      const result = parseUrl("https://threads.com/@username");
      expect(result?.provider).toBe(threads);
      expect(result?.username).toBe("username");
    });

    test("parses Threads URL with www", () => {
      const result = parseUrl("https://www.threads.com/@testuser");
      expect(result?.provider).toBe(threads);
      expect(result?.username).toBe("testuser");
    });

    test("parses Threads .net URL (legacy)", () => {
      const result = parseUrl("https://threads.net/@username");
      expect(result?.provider).toBe(threads);
      expect(result?.username).toBe("username");
    });

    test("parses YouTube URL", () => {
      const result = parseUrl("https://youtube.com/@username");
      expect(result?.provider).toBe(youtube);
      expect(result?.username).toBe("username");
    });

    test("parses YouTube URL with www", () => {
      const result = parseUrl("https://www.youtube.com/@testuser");
      expect(result?.provider).toBe(youtube);
      expect(result?.username).toBe("testuser");
    });

    test("handles http URLs", () => {
      const result = parseUrl("http://tiktok.com/@username");
      expect(result?.provider).toBe(tiktok);
      expect(result?.username).toBe("username");
    });

    test("converts username to lowercase", () => {
      const result = parseUrl("https://tiktok.com/@UserName");
      expect(result?.provider).toBe(tiktok);
      expect(result?.username).toBe("username");
    });

    test("handles usernames with dots and underscores", () => {
      const result = parseUrl("https://instagram.com/user.name_123");
      expect(result?.provider).toBe(instagram);
      expect(result?.username).toBe("user.name_123");
    });

    test("returns null for unknown URL", () => {
      expect(parseUrl("https://example.com/username")).toBeNull();
    });

    test("returns null for invalid URL format", () => {
      expect(parseUrl("not-a-url")).toBeNull();
    });

    test("returns null for URL without username", () => {
      expect(parseUrl("https://tiktok.com/")).toBeNull();
    });
  });

  describe("isUrl", () => {
    test("returns true for https URL", () => {
      expect(isUrl("https://example.com")).toBe(true);
    });

    test("returns true for http URL", () => {
      expect(isUrl("http://example.com")).toBe(true);
    });

    test("returns false for plain text", () => {
      expect(isUrl("username")).toBe(false);
    });

    test("returns false for partial URL", () => {
      expect(isUrl("example.com")).toBe(false);
    });
  });
});
