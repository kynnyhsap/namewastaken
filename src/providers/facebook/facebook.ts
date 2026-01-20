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
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        const html = await response.text();
        // Facebook returns "Page Not Found" or redirects to login for non-existent users
        const notFound =
          html.includes("Page Not Found") ||
          html.includes("This page isn't available") ||
          html.includes("This content isn't available");
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
