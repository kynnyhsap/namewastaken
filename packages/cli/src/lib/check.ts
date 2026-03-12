import { Effect } from "effect";

import { providers, type Provider, ProviderCheckError } from "../providers";

export interface CheckResult {
  provider: Provider;
  taken: boolean;
  error?: string;
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
  return provider.check(username).pipe(
    Effect.map((taken) => ({ provider, taken })),
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

export interface BulkCheckResult {
  results: CheckAllResult[];
}

/**
 * Check multiple usernames across all providers concurrently
 */
export function checkBulk(usernames: string[]): Effect.Effect<BulkCheckResult, never> {
  const checks = usernames.map((username) => checkAll(username));

  return Effect.all(checks, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => ({ results })),
  );
}

/**
 * Check multiple usernames across specific providers concurrently
 */
export function checkBulkWithProviders(
  usernames: string[],
  providerList: Provider[],
): Effect.Effect<BulkCheckResult, never> {
  const checks = usernames.map((username) => checkProviders(providerList, username));

  return Effect.all(checks, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => ({ results })),
  );
}
