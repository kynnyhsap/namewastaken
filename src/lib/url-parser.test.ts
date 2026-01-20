import { describe, test, expect } from "bun:test";
import { parseUrl, isUrl } from "./url-parser";

describe("URL parser", () => {
  describe("parseUrl", () => {
    test("parses TikTok URL", () => {
      expect(parseUrl("https://tiktok.com/@username")).toEqual({
        provider: "tiktok",
        username: "username",
      });
    });

    test("parses TikTok URL with www", () => {
      expect(parseUrl("https://www.tiktok.com/@testuser")).toEqual({
        provider: "tiktok",
        username: "testuser",
      });
    });

    test("parses Instagram URL", () => {
      expect(parseUrl("https://instagram.com/username")).toEqual({
        provider: "instagram",
        username: "username",
      });
    });

    test("parses Instagram URL with www", () => {
      expect(parseUrl("https://www.instagram.com/testuser")).toEqual({
        provider: "instagram",
        username: "testuser",
      });
    });

    test("parses X URL", () => {
      expect(parseUrl("https://x.com/username")).toEqual({
        provider: "x",
        username: "username",
      });
    });

    test("parses Twitter URL (alias for X)", () => {
      expect(parseUrl("https://twitter.com/username")).toEqual({
        provider: "x",
        username: "username",
      });
    });

    test("parses Threads URL", () => {
      expect(parseUrl("https://threads.net/@username")).toEqual({
        provider: "threads",
        username: "username",
      });
    });

    test("parses Threads URL with www", () => {
      expect(parseUrl("https://www.threads.net/@testuser")).toEqual({
        provider: "threads",
        username: "testuser",
      });
    });

    test("parses YouTube URL", () => {
      expect(parseUrl("https://youtube.com/@username")).toEqual({
        provider: "youtube",
        username: "username",
      });
    });

    test("parses YouTube URL with www", () => {
      expect(parseUrl("https://www.youtube.com/@testuser")).toEqual({
        provider: "youtube",
        username: "testuser",
      });
    });

    test("handles http URLs", () => {
      expect(parseUrl("http://tiktok.com/@username")).toEqual({
        provider: "tiktok",
        username: "username",
      });
    });

    test("converts username to lowercase", () => {
      expect(parseUrl("https://tiktok.com/@UserName")).toEqual({
        provider: "tiktok",
        username: "username",
      });
    });

    test("handles usernames with dots and underscores", () => {
      expect(parseUrl("https://instagram.com/user.name_123")).toEqual({
        provider: "instagram",
        username: "user.name_123",
      });
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
