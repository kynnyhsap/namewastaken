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
 * Check username availability on all platforms.
 *
 * @example
 * ```ts
 * const result = await check('mrbeast')
 * result.tiktok.taken  // true
 * ```
 */
export function check(username: string, options?: CheckOptions): Promise<FullCheckResult>;

/**
 * Check multiple usernames on all platforms.
 *
 * @example
 * ```ts
 * const results = await checkMany(['mrbeast', 'pewdiepie'])
 * results.get('mrbeast').tiktok.taken  // true
 * ```
 */
export function checkMany(
  usernames: string[],
  options?: CheckOptions,
): Promise<Map<string, FullCheckResult>>;

/**
 * Check if username is available on ALL platforms.
 *
 * @example
 * ```ts
 * await available('mrbeast')  // false
 * ```
 */
export function available(username: string, options?: CheckOptions): Promise<boolean>;

/**
 * Check if username is taken on ANY platform.
 *
 * @example
 * ```ts
 * await taken('mrbeast')  // true
 * ```
 */
export function taken(username: string, options?: CheckOptions): Promise<boolean>;

/**
 * Filter to specific platforms.
 *
 * @example
 * ```ts
 * await only('tiktok', 'instagram').check('mrbeast')
 * await only('tt', 'ig').available('mrbeast')
 * ```
 */
export function only(...platformNames: string[]): FilteredChecker;

declare const nwt: {
  check: typeof check;
  checkMany: typeof checkMany;
  available: typeof available;
  taken: typeof taken;
  only: typeof only;
  x: PlatformChecker;
  tiktok: PlatformChecker;
  threads: PlatformChecker;
  youtube: PlatformChecker;
  instagram: PlatformChecker;
  platforms: Platform[];
  parseUrl: typeof parseUrl;
};

export default nwt;
