/**
 * namewastaken SDK
 *
 * Check username availability across social media platforms.
 */

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
export function check(username: string, options?: CheckOptions): Promise<CheckResult>;

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
export function checkBulk(usernames: string[], options?: CheckOptions): Promise<BulkResult>;

/** Platform information */
export interface Platform {
  name: string;
  displayName: string;
  aliases: string[];
}

/**
 * List of all supported platforms.
 */
export const platforms: Platform[];

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
export function parseUrl(url: string): { platform: string; username: string } | null;

declare const _default: {
  check: typeof check;
  checkBulk: typeof checkBulk;
  platforms: Platform[];
  parseUrl: typeof parseUrl;
};

export default _default;
