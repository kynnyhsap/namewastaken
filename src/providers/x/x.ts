import { Effect, Schedule, Data } from "effect";

const TIMEOUT_MS = 5000;

export class XCheckError extends Data.TaggedError("XCheckError")<{
  reason: string;
}> {}

export const checkX = (username: string) =>
  Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`https://x.com/${username}`, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        });
        const html = await response.text();
        // If "This account doesn't exist" is found, the username is available
        return !html.includes("This account doesn't exist");
      } finally {
        clearTimeout(timeout);
      }
    },
    catch: (error) =>
      new XCheckError({
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))
    )
  );
