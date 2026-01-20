/**
 * namewastaken SDK
 *
 * Check username availability across social media platforms.
 *
 * @example
 * ```ts
 * import nwt from 'namewastaken'
 *
 * // Quick boolean check
 * await nwt.available('mrbeast')  // false
 *
 * // Platform-specific
 * await nwt.tiktok.available('mrbeast')  // false
 * await nwt.tiktok.taken('mrbeast')  // true
 *
 * // Full check
 * const result = await nwt.check('mrbeast')
 * result.tiktok.taken  // true
 *
 * // Bulk check
 * const results = await nwt.check(['mrbeast', 'pewdiepie'])
 * results.get('mrbeast').tiktok.taken  // true
 *
 * // Filter platforms
 * await nwt.only('tiktok', 'instagram').check('mrbeast')
 * ```
 */

import { Effect } from "effect";
import { checkSingle, checkAll, checkProviders } from "./lib/check";
import {
  providers,
  resolveProvider,
  parseUrl as parseProfileUrl,
  type Provider,
} from "./providers";
import { setCacheEnabled } from "./lib/cache";

// ============================================================================
// Types
// ============================================================================

/** Result for a single platform check */
export interface PlatformCheckResult {
  taken: boolean;
  available: boolean;
  url: string;
  error?: string;
}

/** Results keyed by platform name */
export type CheckResults = {
  x?: PlatformCheckResult;
  tiktok?: PlatformCheckResult;
  threads?: PlatformCheckResult;
  youtube?: PlatformCheckResult;
  instagram?: PlatformCheckResult;
};

/** Full check result with summary */
export type FullCheckResult = CheckResults & {
  username: string;
  summary: {
    available: number;
    taken: number;
    errors: number;
  };
};

/** Options for check operations */
export interface CheckOptions {
  cache?: boolean;
}

/** Platform checker interface */
export interface PlatformChecker {
  /** Check if username is available */
  available(username: string, options?: CheckOptions): Promise<boolean>;
  /** Check if username is taken */
  taken(username: string, options?: CheckOptions): Promise<boolean>;
  /** Get full check result for single username */
  check(username: string, options?: CheckOptions): Promise<PlatformCheckResult>;
  /** Check multiple usernames */
  checkMany(usernames: string[], options?: CheckOptions): Promise<Map<string, PlatformCheckResult>>;
}

/** Filtered checker (from .only()) */
export interface FilteredChecker {
  check(username: string, options?: CheckOptions): Promise<FullCheckResult>;
  checkMany(usernames: string[], options?: CheckOptions): Promise<Map<string, FullCheckResult>>;
  available(username: string, options?: CheckOptions): Promise<boolean>;
  taken(username: string, options?: CheckOptions): Promise<boolean>;
}

// ============================================================================
// Internal helpers
// ============================================================================

async function runWithCache<T>(
  options: CheckOptions | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const useCache = options?.cache ?? true;
  if (!useCache) setCacheEnabled(false);
  try {
    return await fn();
  } finally {
    setCacheEnabled(true);
  }
}

function toResult(
  provider: Provider,
  username: string,
  taken: boolean,
  error?: string,
): PlatformCheckResult {
  return {
    taken: error ? false : taken,
    available: error ? false : !taken,
    url: provider.profileUrl(username),
    ...(error && { error }),
  };
}

// ============================================================================
// Platform-specific checker factory
// ============================================================================

function createPlatformChecker(provider: Provider): PlatformChecker {
  async function checkOne(username: string, options?: CheckOptions): Promise<PlatformCheckResult> {
    return runWithCache(options, async () => {
      const result = await Effect.runPromise(checkSingle(provider, username));
      return toResult(provider, username, result.taken, result.error);
    });
  }

  async function checkMany(
    usernames: string[],
    options?: CheckOptions,
  ): Promise<Map<string, PlatformCheckResult>> {
    return runWithCache(options, async () => {
      const results = new Map<string, PlatformCheckResult>();
      const checks = usernames.map(async (username) => {
        const result = await Effect.runPromise(checkSingle(provider, username));
        results.set(username, toResult(provider, username, result.taken, result.error));
      });
      await Promise.all(checks);
      return results;
    });
  }

  return {
    async available(username: string, options?: CheckOptions): Promise<boolean> {
      const result = await checkOne(username, options);
      return result.available;
    },

    async taken(username: string, options?: CheckOptions): Promise<boolean> {
      const result = await checkOne(username, options);
      return result.taken;
    },

    check: checkOne,
    checkMany,
  };
}

// ============================================================================
// Full checker (all platforms)
// ============================================================================

async function checkOneAllPlatforms(
  username: string,
  providerList: Provider[],
  options?: CheckOptions,
): Promise<FullCheckResult> {
  return runWithCache(options, async () => {
    const effect =
      providerList.length === providers.length
        ? checkAll(username)
        : checkProviders(providerList, username);

    const result = await Effect.runPromise(effect);

    const checkResults: Record<string, PlatformCheckResult> = {};
    let available = 0;
    let taken = 0;
    let errors = 0;

    for (const r of result.results) {
      const platformResult = toResult(r.provider, username, r.taken, r.error);
      checkResults[r.provider.name] = platformResult;

      if (r.error) errors++;
      else if (r.taken) taken++;
      else available++;
    }

    return {
      username,
      ...checkResults,
      summary: { available, taken, errors },
    } as FullCheckResult;
  });
}

async function checkManyAllPlatforms(
  usernames: string[],
  providerList: Provider[],
  options?: CheckOptions,
): Promise<Map<string, FullCheckResult>> {
  return runWithCache(options, async () => {
    const results = new Map<string, FullCheckResult>();
    const checks = usernames.map(async (username) => {
      const result = await checkOneAllPlatforms(username, providerList, { cache: true });
      results.set(username, result);
    });
    await Promise.all(checks);
    return results;
  });
}

// ============================================================================
// Filtered checker (.only())
// ============================================================================

function createFilteredChecker(platformNames: string[]): FilteredChecker {
  const providerList = platformNames
    .map((name) => resolveProvider(name))
    .filter((p): p is Provider => p !== undefined);

  if (providerList.length === 0) {
    throw new Error(
      `No valid platforms found. Available: ${providers.map((p) => p.name).join(", ")}`,
    );
  }

  return {
    check(username: string, options?: CheckOptions): Promise<FullCheckResult> {
      return checkOneAllPlatforms(username, providerList, options);
    },

    checkMany(usernames: string[], options?: CheckOptions): Promise<Map<string, FullCheckResult>> {
      return checkManyAllPlatforms(usernames, providerList, options);
    },

    async available(username: string, options?: CheckOptions): Promise<boolean> {
      const result = await checkOneAllPlatforms(username, providerList, options);
      return result.summary.available === providerList.length;
    },

    async taken(username: string, options?: CheckOptions): Promise<boolean> {
      const result = await checkOneAllPlatforms(username, providerList, options);
      return result.summary.taken > 0;
    },
  };
}

// ============================================================================
// Main SDK
// ============================================================================

/** Platform info */
export interface Platform {
  name: string;
  displayName: string;
  aliases: string[];
}

/** List of all supported platforms */
export const platforms: Platform[] = providers.map((p) => ({
  name: p.name,
  displayName: p.displayName,
  aliases: p.aliases,
}));

/**
 * Parse a social media profile URL to extract platform and username.
 */
export function parseUrl(url: string): { platform: string; username: string } | null {
  const result = parseProfileUrl(url);
  if (!result) return null;
  return { platform: result.provider.name, username: result.username };
}

// Create platform-specific checkers
const x = createPlatformChecker(providers.find((p) => p.name === "x")!);
const tiktok = createPlatformChecker(providers.find((p) => p.name === "tiktok")!);
const threads = createPlatformChecker(providers.find((p) => p.name === "threads")!);
const youtube = createPlatformChecker(providers.find((p) => p.name === "youtube")!);
const instagram = createPlatformChecker(providers.find((p) => p.name === "instagram")!);

/**
 * Check username availability on all platforms.
 *
 * @example
 * ```ts
 * const result = await check('mrbeast')
 * result.tiktok.taken  // true
 * ```
 */
function check(username: string, options?: CheckOptions): Promise<FullCheckResult> {
  return checkOneAllPlatforms(username, providers, options);
}

/**
 * Check multiple usernames on all platforms.
 *
 * @example
 * ```ts
 * const results = await checkMany(['mrbeast', 'pewdiepie'])
 * results.get('mrbeast').tiktok.taken  // true
 * ```
 */
function checkMany(
  usernames: string[],
  options?: CheckOptions,
): Promise<Map<string, FullCheckResult>> {
  return checkManyAllPlatforms(usernames, providers, options);
}

/**
 * Check if username is available on ALL platforms.
 *
 * @example
 * ```ts
 * await available('mrbeast')  // false (taken on at least one platform)
 * ```
 */
async function available(username: string, options?: CheckOptions): Promise<boolean> {
  const result = await checkOneAllPlatforms(username, providers, options);
  return result.summary.available === providers.length;
}

/**
 * Check if username is taken on ANY platform.
 *
 * @example
 * ```ts
 * await taken('mrbeast')  // true (taken on at least one platform)
 * ```
 */
async function taken(username: string, options?: CheckOptions): Promise<boolean> {
  const result = await checkOneAllPlatforms(username, providers, options);
  return result.summary.taken > 0;
}

/**
 * Filter to specific platforms.
 *
 * @example
 * ```ts
 * await only('tiktok', 'instagram').check('mrbeast')
 * await only('tt', 'ig').available('mrbeast')
 * ```
 */
function only(...platformNames: string[]): FilteredChecker {
  return createFilteredChecker(platformNames);
}

// Default export - the main SDK object
const nwt = {
  // Core methods
  check,
  checkMany,
  available,
  taken,
  only,

  // Platform-specific checkers
  x,
  tiktok,
  threads,
  youtube,
  instagram,

  // Utilities
  platforms,
  parseUrl,
};

export default nwt;

// Named exports for convenience
export { check, checkMany, available, taken, only, x, tiktok, threads, youtube, instagram };
