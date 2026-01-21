import { Elysia, t } from "elysia";
import { Effect } from "effect";

import { checkAll } from "../lib/check";

const staticDir = `${import.meta.dir}/static`;

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimiter) {
    if (now > entry.resetAt) {
      rateLimiter.delete(ip);
    }
  }
}, RATE_WINDOW);

const app = new Elysia()
  .get("/", async () => {
    const file = Bun.file(`${staticDir}/index.html`);
    return new Response(await file.text(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  })
  .get("/styles.css", async () => {
    const file = Bun.file(`${staticDir}/styles.css`);
    return new Response(await file.text(), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  })
  .get("/main.js", async () => {
    const file = Bun.file(`${staticDir}/main.js`);
    return new Response(await file.text(), {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  })
  .post(
    "/api/check",
    async ({ body, request, set }) => {
      // Get client IP
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // Check rate limit
      if (isRateLimited(ip)) {
        set.status = 429;
        return { error: "Too many requests. Please try again later." };
      }

      const { username } = body;

      // Validate username
      if (!username || !/^[a-z0-9._]+$/i.test(username)) {
        set.status = 400;
        return { error: "Invalid username format" };
      }

      try {
        const result = await Effect.runPromise(checkAll(username.toLowerCase()));

        // Format response
        const results: Record<string, { taken: boolean; available: boolean; url: string; error?: string }> = {};
        let available = 0;
        let taken = 0;
        let errors = 0;

        for (const r of result.results) {
          if (r.error) {
            errors++;
          } else if (r.taken) {
            taken++;
          } else {
            available++;
          }

          results[r.provider.name] = {
            taken: r.taken,
            available: !r.taken && !r.error,
            url: r.provider.profileUrl(username.toLowerCase()),
            ...(r.error && { error: r.error }),
          };
        }

        return {
          username: username.toLowerCase(),
          results,
          summary: { available, taken, errors },
        };
      } catch (error) {
        console.error("Check error:", error);
        set.status = 500;
        return { error: "Internal server error" };
      }
    },
    {
      body: t.Object({
        username: t.String(),
      }),
    }
  )
  .get("/api/health", () => ({ ok: true }))
  .listen(process.env.PORT || 3000);

console.log(`Website running at http://localhost:${app.server?.port}`);
