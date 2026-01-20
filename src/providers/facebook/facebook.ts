import { Effect, Schedule } from "effect";

import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 5000;

const URL_PATTERN = /^https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)/;

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`https://www.facebook.com/${username}`, {
          signal: controller.signal,
          headers: {
            "User-Agent": "curl/7.79.1",
            Accept: "*/*",
          },
        });
        const html = await response.text();
        // Non-existent profiles have generic titles like "Facebook" or "Error"
        // Existing profiles have the actual username or page name as title
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        const title = titleMatch?.[1] ?? "";
        // If title is generic, the profile doesn't exist
        const notFound = title === "" || title === "Facebook" || title === "Error";
        return !notFound;
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "facebook",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))),
  );

export const facebook: Provider = {
  name: "facebook",
  displayName: "Facebook",
  aliases: ["facebook", "fb"],
  check,
  profileUrl: (username) => `https://facebook.com/${username}`,
  parseUrl: (url) => {
    const match = url.match(URL_PATTERN);
    return match?.[1]?.toLowerCase() ?? null;
  },
};
