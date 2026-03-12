import { Effect, Schedule } from "effect";

import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 5000;

const URL_PATTERNS = [
  /^https?:\/\/(?:www\.)?t\.me\/([a-zA-Z0-9_]+)/,
  /^https?:\/\/(?:www\.)?telegram\.me\/([a-zA-Z0-9_]+)/,
];

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`https://t.me/${username}`, {
          signal: controller.signal,
          headers: {
            "User-Agent": "curl/7.79.1",
          },
        });
        const html = await response.text();
        // Available usernames have:
        // - og:image pointing to generic Telegram logo
        // - empty og:description
        // Taken usernames (personal or channels) have:
        // - og:image pointing to profile/channel photo (cdn4.telesco.pe)
        // - og:description with bio/description
        const hasProfileImage = html.includes('og:image" content="https://cdn');
        return hasProfileImage;
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "telegram",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))),
  );

export const telegram: Provider = {
  name: "telegram",
  displayName: "Telegram",
  aliases: ["telegram", "tg"],
  check,
  profileUrl: (username) => `https://t.me/${username}`,
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
