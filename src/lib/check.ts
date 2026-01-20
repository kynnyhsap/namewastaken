import { Effect } from "effect";
import { providers, type Provider, ProviderCheckError } from "../providers";
import { getCached, setCache } from "./cache";

export interface CheckResult {
  provider: Provider;
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
  provider: Provider,
  username: string,
): Effect.Effect<CheckResult, never> {
  // Check cache first
  const cached = getCached(provider.name, username);
  if (cached !== null) {
    return Effect.succeed({ provider, taken: cached, cached: true });
  }

  return provider.check(username).pipe(
    Effect.map((taken) => {
      // Store in cache
      setCache(provider.name, username, taken);
      return { provider, taken };
    }),
    Effect.catchAll((error: ProviderCheckError) =>
      Effect.succeed({
        provider,
        taken: false,
        error: error.reason,
      }),
    ),
  );
}

/**
 * Check all providers for a username concurrently
 */
export function checkAll(username: string): Effect.Effect<CheckAllResult, never> {
  const checks = providers.map((provider) => checkSingle(provider, username));

  return Effect.all(checks, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => ({
      username,
      results,
    })),
  );
}

/**
 * Check specific providers for a username concurrently
 */
export function checkProviders(
  providerList: Provider[],
  username: string,
): Effect.Effect<CheckAllResult, never> {
  const checks = providerList.map((provider) => checkSingle(provider, username));

  return Effect.all(checks, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => ({
      username,
      results,
    })),
  );
}
