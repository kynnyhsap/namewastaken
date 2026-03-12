import { Hono } from "hono";

import { check, platforms } from "../../../src/sdk";

interface ApiResult {
  username: string;
  results: Record<string, { taken: boolean; available: boolean; url: string; error?: string }>;
  summary: {
    available: number;
    taken: number;
    errors: number;
  };
}

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const CACHE_TTL_MS = 5 * 60_000;

const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const usernameCache = new Map<string, { data: ApiResult; expiresAt: number }>();

function cleanupMaps(now: number) {
  for (const [ip, entry] of rateLimiter) {
    if (now > entry.resetAt) {
      rateLimiter.delete(ip);
    }
  }

  for (const [username, entry] of usernameCache) {
    if (now > entry.expiresAt) {
      usernameCache.delete(username);
    }
  }
}

function isRateLimited(ip: string, now: number): boolean {
  const existing = rateLimiter.get(ip);

  if (!existing || now > existing.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (existing.count >= RATE_LIMIT) {
    return true;
  }

  existing.count += 1;
  return false;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function formatResult(result: Awaited<ReturnType<typeof check>>): ApiResult {
  const flatResult = result as unknown as Record<
    string,
    { taken: boolean; available: boolean; url: string; error?: string } | undefined
  >;

  const formattedResults: ApiResult["results"] = {};

  for (const platform of platforms) {
    const entry = flatResult[platform.name];
    if (!entry) {
      continue;
    }

    formattedResults[platform.name] = {
      taken: entry.taken,
      available: entry.available,
      url: entry.url,
      ...(entry.error ? { error: entry.error } : {}),
    };
  }

  return {
    username: result.username,
    results: formattedResults,
    summary: result.summary,
  };
}

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

app.post("/api/check", async (c) => {
  const now = Date.now();
  cleanupMaps(now);

  const ip = getClientIp(c.req.raw);
  if (isRateLimited(ip, now)) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  let payload: { username?: string } | null = null;
  try {
    payload = await c.req.json<{ username?: string }>();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  const normalizedUsername = payload?.username?.trim().toLowerCase();
  if (!normalizedUsername || !/^[a-z0-9._]+$/i.test(normalizedUsername)) {
    return c.json({ error: "Invalid username format" }, 400);
  }

  const cached = usernameCache.get(normalizedUsername);
  if (cached && now <= cached.expiresAt) {
    return c.json(cached.data);
  }

  try {
    const sdkResult = await check(normalizedUsername);
    const response = formatResult(sdkResult);

    usernameCache.set(normalizedUsername, {
      data: response,
      expiresAt: now + CACHE_TTL_MS,
    });

    return c.json(response);
  } catch (error) {
    console.error("/api/check failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
