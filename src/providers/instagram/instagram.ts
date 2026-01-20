import { Effect, Schedule, Data } from "effect";

const TIMEOUT_MS = 5000;

export class InstagramCheckError extends Data.TaggedError("InstagramCheckError")<{
  reason: string;
}> {}

export const checkInstagram = (username: string) =>
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
      new InstagramCheckError({
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))
    )
  );
