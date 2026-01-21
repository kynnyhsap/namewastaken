import { Effect } from "effect";
import { Elysia, t } from "elysia";

import { checkAll } from "../lib/check";

const staticDir = `${import.meta.dir}/static`;

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per window (higher for instant search)
const RATE_WINDOW = 60 * 1000; // 1 minute

// Simple in-memory cache for username checks
interface CacheEntry {
  data: {
    username: string;
    results: Record<string, { taken: boolean; available: boolean; url: string; error?: string }>;
    summary: { available: number; taken: number; errors: number };
  };
  expiresAt: number;
}
const usernameCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResult(username: string): CacheEntry["data"] | null {
  const entry = usernameCache.get(username);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    usernameCache.delete(username);
    return null;
  }
  return entry.data;
}

function setCachedResult(username: string, data: CacheEntry["data"]): void {
  usernameCache.set(username, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [username, entry] of usernameCache) {
    if (now > entry.expiresAt) {
      usernameCache.delete(username);
    }
  }
}, CACHE_TTL);

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
      const normalizedUsername = username?.toLowerCase();

      // Validate username
      if (!normalizedUsername || !/^[a-z0-9._]+$/i.test(normalizedUsername)) {
        set.status = 400;
        return { error: "Invalid username format" };
      }

      // Check cache first
      const cached = getCachedResult(normalizedUsername);
      if (cached) {
        return cached;
      }

      try {
        const result = await Effect.runPromise(checkAll(normalizedUsername));

        // Format response
        const results: Record<
          string,
          { taken: boolean; available: boolean; url: string; error?: string }
        > = {};
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
            url: r.provider.profileUrl(normalizedUsername),
            ...(r.error && { error: r.error }),
          };
        }

        const responseData = {
          username: normalizedUsername,
          results,
          summary: { available, taken, errors },
        };

        // Cache the result
        setCachedResult(normalizedUsername, responseData);

        return responseData;
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
    },
  )
  .get("/api/health", () => ({ ok: true }))
  .listen(process.env.PORT || 4040);

console.log(`Website running at http://localhost:${app.server?.port}`);
