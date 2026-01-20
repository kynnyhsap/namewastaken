/**
 * namewastaken SDK
 *
 * Check username availability across social media platforms.
 *
 * @example
 * ```ts
 * import { check, checkBulk, platforms } from 'namewastaken'
 *
 * // Check a single username on all platforms
 * const result = await check('mrbeast')
 * console.log(result)
 *
 * // Check on specific platforms
 * const result = await check('mrbeast', { platforms: ['tiktok', 'instagram'] })
 *
 * // Check multiple usernames
 * const results = await checkBulk(['mrbeast', 'pewdiepie'])
 *
 * // List all platforms
 * console.log(platforms)
 * ```
 */

import { Effect } from "effect";
import {
  checkAll,
  checkProviders,
  checkBulk as checkBulkEffect,
  checkBulkWithProviders,
  type CheckAllResult,
  type BulkCheckResult,
} from "./lib/check";
import {
  providers,
  resolveProvider,
  parseUrl as parseProfileUrl,
  type Provider,
} from "./providers";
import { setCacheEnabled } from "./lib/cache";

/** Platform availability result */
export interface PlatformResult {
  platform: string;
  displayName: string;
  taken: boolean;
  available: boolean;
  error?: string;
  url: string;
}

/** Result from checking a username */
export interface CheckResult {
  username: string;
  results: PlatformResult[];
  summary: {
    available: number;
    taken: number;
    errors: number;
  };
}

/** Options for check functions */
export interface CheckOptions {
  /** Specific platforms to check (e.g., ['tiktok', 'ig', 'x']) */
  platforms?: string[];
  /** Whether to use cached results (default: true) */
  cache?: boolean;
}

/**
 * Convert internal result to SDK result format
 */
function toCheckResult(internal: CheckAllResult): CheckResult {
  const results: PlatformResult[] = internal.results.map((r) => ({
    platform: r.provider.name,
    displayName: r.provider.displayName,
    taken: r.taken,
    available: !r.taken && !r.error,
    error: r.error,
    url: r.provider.profileUrl(internal.username),
  }));

  return {
    username: internal.username,
    results,
    summary: {
      available: results.filter((r) => r.available).length,
      taken: results.filter((r) => r.taken).length,
      errors: results.filter((r) => r.error).length,
    },
  };
}

/**
 * Check if a username is available on social media platforms.
 *
 * @param username - The username to check
 * @param options - Optional settings
 * @returns Promise with availability results
 *
 * @example
 * ```ts
 * // Check on all platforms
 * const result = await check('mrbeast')
 *
 * // Check on specific platforms
 * const result = await check('mrbeast', { platforms: ['tiktok', 'instagram'] })
 *
 * // Skip cache
 * const result = await check('mrbeast', { cache: false })
 * ```
 */
export async function check(username: string, options: CheckOptions = {}): Promise<CheckResult> {
  const { platforms: platformNames, cache = true } = options;

  if (!cache) setCacheEnabled(false);

  try {
    let effect: Effect.Effect<CheckAllResult, never>;

    if (platformNames && platformNames.length > 0) {
      const platformList = platformNames
        .map((name) => resolveProvider(name))
        .filter((p): p is Provider => p !== undefined);

      if (platformList.length === 0) {
        throw new Error(
          `No valid platforms found. Available: ${platforms.map((p) => p.name).join(", ")}`,
        );
      }

      effect = checkProviders(platformList, username);
    } else {
      effect = checkAll(username);
    }

    const result = await Effect.runPromise(effect);
    return toCheckResult(result);
  } finally {
    setCacheEnabled(true);
  }
}

/** Result from bulk checking */
export interface BulkResult {
  results: CheckResult[];
  summary: {
    available: number;
    taken: number;
    errors: number;
  };
}

/**
 * Check multiple usernames for availability.
 *
 * @param usernames - Array of usernames to check
 * @param options - Optional settings
 * @returns Promise with availability results for all usernames
 *
 * @example
 * ```ts
 * const results = await checkBulk(['mrbeast', 'pewdiepie', 'ninja'])
 *
 * // Check on specific platforms
 * const results = await checkBulk(['mrbeast', 'pewdiepie'], { platforms: ['tiktok'] })
 * ```
 */
export async function checkBulk(
  usernames: string[],
  options: CheckOptions = {},
): Promise<BulkResult> {
  const { platforms: platformNames, cache = true } = options;

  if (!cache) setCacheEnabled(false);

  try {
    let effect: Effect.Effect<BulkCheckResult, never>;

    if (platformNames && platformNames.length > 0) {
      const platformList = platformNames
        .map((name) => resolveProvider(name))
        .filter((p): p is Provider => p !== undefined);

      if (platformList.length === 0) {
        throw new Error(
          `No valid platforms found. Available: ${platforms.map((p) => p.name).join(", ")}`,
        );
      }

      effect = checkBulkWithProviders(usernames, platformList);
    } else {
      effect = checkBulkEffect(usernames);
    }

    const result = await Effect.runPromise(effect);
    const results = result.results.map(toCheckResult);

    return {
      results,
      summary: {
        available: results.reduce((acc, r) => acc + r.summary.available, 0),
        taken: results.reduce((acc, r) => acc + r.summary.taken, 0),
        errors: results.reduce((acc, r) => acc + r.summary.errors, 0),
      },
    };
  } finally {
    setCacheEnabled(true);
  }
}

/** Platform information */
export interface Platform {
  name: string;
  displayName: string;
  aliases: string[];
}

/**
 * List of all supported platforms.
 */
export const platforms: Platform[] = providers.map((p) => ({
  name: p.name,
  displayName: p.displayName,
  aliases: p.aliases,
}));

/**
 * Parse a social media profile URL to extract the platform and username.
 *
 * @param url - The profile URL to parse
 * @returns The platform and username, or null if not recognized
 *
 * @example
 * ```ts
 * const parsed = parseUrl('https://tiktok.com/@mrbeast')
 * // { platform: 'tiktok', username: 'mrbeast' }
 * ```
 */
export function parseUrl(url: string): { platform: string; username: string } | null {
  const result = parseProfileUrl(url);
  if (!result) return null;
  return {
    platform: result.provider.name,
    username: result.username,
  };
}

// Default export for convenience
export default {
  check,
  checkBulk,
  platforms,
  parseUrl,
};
