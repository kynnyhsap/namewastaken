import { rateLimiter } from "hono-rate-limiter";
import { getConnInfo } from "hono/bun";

export const rateLimitsMiddleware = rateLimiter({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  keyGenerator: (c) => {
    return getConnInfo(c).remote.address;
  },
});
