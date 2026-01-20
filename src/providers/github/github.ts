import { Effect, Schedule } from "effect";

import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 5000;
const BASE_URL = "https://github.com";

const URL_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)/;

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`${BASE_URL}/${username}`, {
          method: "HEAD",
          signal: controller.signal,
          headers: {
            "User-Agent": "curl/7.79.1",
          },
        });
        // 200 = user exists (taken), 404 = not found (available)
        return response.status === 200;
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "github",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))),
  );

export const github: Provider = {
  name: "github",
  displayName: "GitHub",
  aliases: ["github", "gh"],
  check,
  profileUrl: (username) => `${BASE_URL}/${username}`,
  parseUrl: (url) => {
    const match = url.match(URL_PATTERN);
    return match?.[1]?.toLowerCase() ?? null;
  },
};
