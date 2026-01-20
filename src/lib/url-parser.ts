import { type ProviderName } from "../providers";

export interface ParsedUrl {
  provider: ProviderName;
  username: string;
}

const URL_PATTERNS: Array<{
  pattern: RegExp;
  provider: ProviderName;
  usernameGroup: number;
}> = [
  // TikTok: https://tiktok.com/@username or https://www.tiktok.com/@username
  {
    pattern: /^https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/,
    provider: "tiktok",
    usernameGroup: 1,
  },
  // Instagram: https://instagram.com/username or https://www.instagram.com/username
  {
    pattern: /^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/,
    provider: "instagram",
    usernameGroup: 1,
  },
  // X: https://x.com/username or https://www.x.com/username
  {
    pattern: /^https?:\/\/(?:www\.)?x\.com\/([a-zA-Z0-9._]+)/,
    provider: "x",
    usernameGroup: 1,
  },
  // Twitter (alias for X): https://twitter.com/username
  {
    pattern: /^https?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9._]+)/,
    provider: "x",
    usernameGroup: 1,
  },
  // Threads: https://threads.net/@username or https://www.threads.net/@username
  {
    pattern: /^https?:\/\/(?:www\.)?threads\.net\/@([a-zA-Z0-9._]+)/,
    provider: "threads",
    usernameGroup: 1,
  },
  // YouTube: https://youtube.com/@username or https://www.youtube.com/@username
  {
    pattern: /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9._]+)/,
    provider: "youtube",
    usernameGroup: 1,
  },
];

export function parseUrl(url: string): ParsedUrl | null {
  for (const { pattern, provider, usernameGroup } of URL_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[usernameGroup]) {
      return {
        provider,
        username: match[usernameGroup].toLowerCase(),
      };
    }
  }
  return null;
}

export function isUrl(input: string): boolean {
  return input.startsWith("http://") || input.startsWith("https://");
}
