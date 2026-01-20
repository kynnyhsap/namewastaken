import { describe, test, expect } from "bun:test";
import { HandleSchema, parseHandle, safeParseHandle } from "./schema";

describe("Handle validation", () => {
  describe("HandleSchema", () => {
    test("accepts valid usernames", () => {
      expect(() => HandleSchema.parse("validuser")).not.toThrow();
      expect(() => HandleSchema.parse("user.name")).not.toThrow();
      expect(() => HandleSchema.parse("user_name")).not.toThrow();
      expect(() => HandleSchema.parse("user123")).not.toThrow();
      expect(() => HandleSchema.parse("a")).not.toThrow();
      expect(() => HandleSchema.parse("User.Name_123")).not.toThrow();
    });

    test("rejects invalid characters", () => {
      expect(() => HandleSchema.parse("user@name")).toThrow();
      expect(() => HandleSchema.parse("user name")).toThrow();
      expect(() => HandleSchema.parse("user!")).toThrow();
      expect(() => HandleSchema.parse("user#tag")).toThrow();
      expect(() => HandleSchema.parse("user$money")).toThrow();
      expect(() => HandleSchema.parse("user-name")).toThrow();
    });

    test("rejects empty username", () => {
      expect(() => HandleSchema.parse("")).toThrow();
    });

    test("rejects too long username (>30 chars)", () => {
      expect(() => HandleSchema.parse("a".repeat(31))).toThrow();
    });

    test("accepts 30 character username", () => {
      expect(() => HandleSchema.parse("a".repeat(30))).not.toThrow();
    });

    test("transforms to lowercase", () => {
      expect(HandleSchema.parse("UserName")).toBe("username");
      expect(HandleSchema.parse("ALLCAPS")).toBe("allcaps");
      expect(HandleSchema.parse("MiXeD.CaSe_123")).toBe("mixed.case_123");
    });
  });

  describe("parseHandle", () => {
    test("returns parsed lowercase username", () => {
      expect(parseHandle("TestUser")).toBe("testuser");
    });

    test("throws on invalid input", () => {
      expect(() => parseHandle("invalid@user")).toThrow();
    });
  });

  describe("safeParseHandle", () => {
    test("returns success for valid input", () => {
      const result = safeParseHandle("validuser");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("validuser");
      }
    });

    test("returns error for invalid input", () => {
      const result = safeParseHandle("invalid@user");
      expect(result.success).toBe(false);
    });

    test("returns error for empty input", () => {
      const result = safeParseHandle("");
      expect(result.success).toBe(false);
    });
  });
});
