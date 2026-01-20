/**
 * namewastaken SDK
 *
 * Check username availability across social media platforms.
 */

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
  /** Filter to specific platforms (e.g., ['tiktok', 'ig']) */
  platforms?: string[];
  /** Whether to use cached results (default: true) */
  cache?: boolean;
}

/** Platform checker interface (for single platform like nwt.tiktok) */
export interface PlatformChecker {
  /** Check if username is available */
  available(username: string, options?: { cache?: boolean }): Promise<boolean>;
  /** Check if username is taken */
  taken(username: string, options?: { cache?: boolean }): Promise<boolean>;
  /** Get full check result for single username */
  check(username: string, options?: { cache?: boolean }): Promise<PlatformCheckResult>;
  /** Check multiple usernames */
  checkMany(
    usernames: string[],
    options?: { cache?: boolean },
  ): Promise<Map<string, PlatformCheckResult>>;
}

/** Platform info */
export interface Platform {
  name: string;
  displayName: string;
  aliases: string[];
}

/** List of all supported platforms */
export const platforms: Platform[];

/**
 * Parse a social media profile URL to extract platform and username.
 */
export function parseUrl(url: string): { platform: string; username: string } | null;

/** Platform-specific checker for X/Twitter */
export const x: PlatformChecker;
/** Platform-specific checker for TikTok */
export const tiktok: PlatformChecker;
/** Platform-specific checker for Threads */
export const threads: PlatformChecker;
/** Platform-specific checker for YouTube */
export const youtube: PlatformChecker;
/** Platform-specific checker for Instagram */
export const instagram: PlatformChecker;

/**
 * Check username availability.
 *
 * @example
 * ```ts
 * // All platforms
 * const result = await check('mrbeast')
 * result.tiktok.taken  // true
 *
 * // Specific platforms
 * const result = await check('mrbeast', { platforms: ['tiktok', 'ig'] })
 * ```
 */
export function check(username: string, options?: CheckOptions): Promise<FullCheckResult>;

/**
 * Check multiple usernames.
 *
 * @example
 * ```ts
 * // All platforms
 * const results = await checkMany(['mrbeast', 'pewdiepie'])
 * results.get('mrbeast').tiktok.taken  // true
 *
 * // Specific platforms
 * const results = await checkMany(['mrbeast'], { platforms: ['tt'] })
 * ```
 */
export function checkMany(
  usernames: string[],
  options?: CheckOptions,
): Promise<Map<string, FullCheckResult>>;

/**
 * Check if username is available on ALL specified platforms.
 *
 * @example
 * ```ts
 * await available('mrbeast')  // false
 * await available('mrbeast', { platforms: ['tiktok'] })
 * ```
 */
export function available(username: string, options?: CheckOptions): Promise<boolean>;

/**
 * Check if username is taken on ANY of the specified platforms.
 *
 * @example
 * ```ts
 * await taken('mrbeast')  // true
 * await taken('mrbeast', { platforms: ['tiktok'] })
 * ```
 */
export function taken(username: string, options?: CheckOptions): Promise<boolean>;

declare const nwt: {
  check: typeof check;
  checkMany: typeof checkMany;
  available: typeof available;
  taken: typeof taken;
  x: PlatformChecker;
  tiktok: PlatformChecker;
  threads: PlatformChecker;
  youtube: PlatformChecker;
  instagram: PlatformChecker;
  platforms: Platform[];
  parseUrl: typeof parseUrl;
};

export default nwt;
