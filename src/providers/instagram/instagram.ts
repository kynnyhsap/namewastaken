import { Effect, Schedule } from "effect";
import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 5000;

const URL_PATTERN = /^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/;

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`https://www.instagram.com/${username}`, {
          signal: controller.signal,
        });
        const html = await response.text();
        return html.includes(`{"username":"${username}"}`);
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "instagram",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))
    )
  );

export const instagram: Provider = {
  name: "instagram",
  displayName: "Instagram",
  aliases: ["instagram", "ig"],
  check,
  profileUrl: (username) => `https://instagram.com/${username}`,
  parseUrl: (url) => {
    const match = url.match(URL_PATTERN);
    return match?.[1]?.toLowerCase() ?? null;
  },
};
