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
        // Available usernames have title "Telegram: Contact @username"
        // Taken usernames have title "Telegram: View @username" or the actual name
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        const title = titleMatch?.[1] ?? "";
        // If title contains "Contact @", the username is available
        return !title.includes("Contact @");
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
