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
        // Use Twitter's syndication API which returns server-rendered HTML with embedded JSON
        const response = await fetch(
          `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
          {
            signal: controller.signal,
            headers: {
              "User-Agent": "curl/7.79.1",
            },
          },
        );
        const html = await response.text();
        // Check for rate limiting (Node's fetch gets rate limited more than Bun's)
        if (html.includes("Rate limit exceeded")) {
          throw new Error("Rate limited by Twitter");
        }
        // The page contains JSON with "hasResults":true for existing users
        return html.includes('"hasResults":true');
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
