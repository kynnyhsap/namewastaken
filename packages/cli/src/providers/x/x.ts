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
        // Use Twitter's oEmbed API - returns 200 for existing users, 404 for non-existent
        const response = await fetch(
          `https://publish.twitter.com/oembed?url=https://twitter.com/${username}`,
          {
            signal: controller.signal,
          },
        );
        // 200 = user exists (taken), 404 = user doesn't exist (available)
        return response.status === 200;
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
