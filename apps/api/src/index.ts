import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";

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

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const CACHE_TTL_MS = 10 * 60_000;
const RESPONSE_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=60";

const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const usernameCache = new Map<string, { data: ApiResult; expiresAt: number }>();

const validPlatformNames = new Set<string>();
for (const platform of platforms) {
  validPlatformNames.add(platform.name.toLowerCase());
  for (const alias of platform.aliases) {
    validPlatformNames.add(alias.toLowerCase());
  }
}

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
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function parsePlatformQuery(rawUrl: string): { platforms?: string[]; error?: string } {
  const url = new URL(rawUrl);
  const values = [
    ...url.searchParams.getAll("platforms"),
    ...url.searchParams.getAll("platforms[]"),
  ];

  if (values.length === 0) {
    return {};
  }

  const parsedValues: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("[")) {
      try {
        const jsonValue = JSON.parse(trimmed);
        if (!Array.isArray(jsonValue)) {
          return { error: "platforms query must be an array when using JSON format" };
        }
        for (const item of jsonValue) {
          if (typeof item === "string") {
            parsedValues.push(item);
          }
        }
      } catch {
        return { error: "Invalid JSON in platforms query" };
      }
      continue;
    }

    for (const item of trimmed.split(",")) {
      const normalized = item.trim();
      if (normalized) {
        parsedValues.push(normalized);
      }
    }
  }

  if (parsedValues.length === 0) {
    return { error: "No valid platforms were provided" };
  }

  return {
    platforms: [...new Set(parsedValues.map((item) => item.toLowerCase()))],
  };
}

function validatePlatforms(platformList: string[]): string[] {
  return platformList.filter((platform) => !validPlatformNames.has(platform));
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

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

async function handleCheck(c: Context): Promise<Response> {
  const now = Date.now();
  cleanupMaps(now);

  const ip = getClientIp(c.req.raw);
  if (isRateLimited(ip, now)) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  const username = c.req.param("username")?.trim().toLowerCase();
  const platformFromPath = c.req.param("platform")?.trim().toLowerCase();
  const platformQuery = parsePlatformQuery(c.req.raw.url);

  if (platformQuery.error) {
    return c.json({ error: platformQuery.error }, 400);
  }

  if (!username || !/^[a-z0-9._]+$/i.test(username)) {
    return c.json({ error: "Invalid username format" }, 400);
  }

  if (platformFromPath && platformQuery.platforms) {
    return c.json({ error: "Use either /:platform or ?platforms=... but not both" }, 400);
  }

  const requestedPlatforms =
    platformFromPath !== undefined && platformFromPath.length > 0
      ? [platformFromPath]
      : platformQuery.platforms;

  if (requestedPlatforms && requestedPlatforms.length > 0) {
    const unknownPlatforms = validatePlatforms(requestedPlatforms);
    if (unknownPlatforms.length > 0) {
      return c.json(
        {
          error: `Unknown platform(s): ${unknownPlatforms.join(", ")}`,
          available: platforms.map((platform) => platform.name),
        },
        400,
      );
    }
  }

  const cacheScope = requestedPlatforms?.slice().sort().join(",") ?? "all";
  const cacheKey = `${username}|${cacheScope}`;

  const cached = usernameCache.get(cacheKey);
  if (cached && now <= cached.expiresAt) {
    c.header("Cache-Control", RESPONSE_CACHE_CONTROL);
    return c.json(cached.data);
  }

  try {
    const sdkResult = await check(
      username,
      requestedPlatforms ? { platforms: requestedPlatforms } : undefined,
    );
    const response = formatResult(sdkResult);

    usernameCache.set(cacheKey, {
      data: response,
      expiresAt: now + CACHE_TTL_MS,
    });

    c.header("Cache-Control", RESPONSE_CACHE_CONTROL);
    return c.json(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes("No valid platforms found")) {
      return c.json({ error: error.message }, 400);
    }

    console.error("/check failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

app.get("/check/:username", (c) => handleCheck(c));
app.get("/check/:username/:platform", (c) => handleCheck(c));

export default app;
