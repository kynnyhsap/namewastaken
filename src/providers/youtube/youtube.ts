import { Effect, Schedule, Data } from "effect";

const TIMEOUT_MS = 5000;

export class YouTubeCheckError extends Data.TaggedError("YouTubeCheckError")<{
  reason: string;
}> {}

export const checkYouTube = (username: string) =>
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
      new YouTubeCheckError({
        reason: error instanceof Error ? error.message : "Network error",
      }),
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))
    )
  );
