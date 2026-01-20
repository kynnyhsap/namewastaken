import { Effect } from "effect";
import {
  type ProviderName,
  type CheckError,
  ALL_PROVIDERS,
  getProviderChecker,
} from "../providers";
import { getCached, setCache } from "./cache";

export interface CheckResult {
  provider: ProviderName;
  taken: boolean;
  error?: string;
  cached?: boolean;
}

export interface CheckAllResult {
  username: string;
  results: CheckResult[];
}

/**
 * Check a single provider for a username
 */
export function checkSingle(
  provider: ProviderName,
  username: string
): Effect.Effect<CheckResult, never> {
  // Check cache first
  const cached = getCached(provider, username);
  if (cached !== null) {
    return Effect.succeed({ provider, taken: cached, cached: true });
  }

  const checker = getProviderChecker(provider);

  return checker(username).pipe(
    Effect.map((taken) => {
      // Store in cache
      setCache(provider, username, taken);
      return { provider, taken };
    }),
    Effect.catchAll((error: CheckError) =>
      Effect.succeed({
        provider,
        taken: false,
        error: error.reason,
      })
    )
  );
}

/**
 * Check all providers for a username concurrently
 */
export function checkAll(username: string): Effect.Effect<CheckAllResult, never> {
  const checks = ALL_PROVIDERS.map((provider) => checkSingle(provider, username));

  return Effect.all(checks, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => ({
      username,
      results,
    }))
  );
}

/**
 * Check specific providers for a username concurrently
 */
export function checkProviders(
  providers: ProviderName[],
  username: string
): Effect.Effect<CheckAllResult, never> {
  const checks = providers.map((provider) => checkSingle(provider, username));

  return Effect.all(checks, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => ({
      username,
      results,
    }))
  );
}
