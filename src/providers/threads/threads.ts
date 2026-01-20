import { Effect, Schedule, Data } from "effect";

const TIMEOUT_MS = 10000;

export class ThreadsCheckError extends Data.TaggedError("ThreadsCheckError")<{
  reason: string;
}> {}

export const checkThreads = (username: string) =>
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
      new ThreadsCheckError({
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))
    )
  );
