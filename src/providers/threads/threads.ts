import { Effect, Schedule } from "effect";
import { Provider, ProviderCheckError } from "../types";

const TIMEOUT_MS = 10000;

const URL_PATTERN = /^https?:\/\/(?:www\.)?threads\.(?:net|com)\/@([a-zA-Z0-9._]+)/;

const check = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      // Use threads.com directly (threads.net just redirects there)
      // Use a simple User-Agent to avoid SPA mode which doesn't redirect
      const response = await fetch(`https://www.threads.com/@${username}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "namewastaken/1.0",
        },
      });

      // Check if we were redirected to login page
      const finalUrl = response.url.toLowerCase();
      const isLoginPage = finalUrl.includes("/login");

      // If redirected to login, username is available (not taken)
      // If NOT redirected to login, username exists (taken)
      return !isLoginPage;
    },
    catch: (error) =>
      new ProviderCheckError({
        provider: "threads",
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))),
  );

export const threads: Provider = {
  name: "threads",
  displayName: "Threads",
  aliases: ["threads"],
  check,
  profileUrl: (username) => `https://threads.net/@${username}`,
  parseUrl: (url) => {
    const match = url.match(URL_PATTERN);
    return match?.[1]?.toLowerCase() ?? null;
  },
};
