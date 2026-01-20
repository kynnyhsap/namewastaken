import { Effect, Schedule } from "effect";
import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 5000;

const URL_PATTERNS = [
  /^https?:\/\/(?:www\.)?x\.com\/([a-zA-Z0-9._]+)/,
  /^https?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9._]+)/,
];

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`https://x.com/${username}`, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        });
        const html = await response.text();
        // If "This account doesn't exist" is found, the username is available
        return !html.includes("This account doesn't exist");
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "x",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))),
  );

export const x: Provider = {
  name: "x",
  displayName: "X/Twitter",
  aliases: ["x", "twitter"],
  check,
  profileUrl: (username) => `https://x.com/${username}`,
  parseUrl: (url) => {
    for (const pattern of URL_PATTERNS) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1].toLowerCase();
      }
    }
    return null;
  },
};
