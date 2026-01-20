import { Effect, Schedule } from "effect";
import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 5000;

const URL_PATTERN = /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9._]+)/;

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`https://www.youtube.com/@${username}`, {
          signal: controller.signal,
        });
        // If status is not 404, the handle is taken
        return response.status !== 404;
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "youtube",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))),
  );

export const youtube: Provider = {
  name: "youtube",
  displayName: "YouTube",
  aliases: ["youtube", "yt"],
  check,
  profileUrl: (username) => `https://youtube.com/@${username}`,
  parseUrl: (url) => {
    const match = url.match(URL_PATTERN);
    return match?.[1]?.toLowerCase() ?? null;
  },
};
