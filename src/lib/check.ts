import { Effect } from "effect";
import {
  type ProviderName,
  type CheckError,
  ALL_PROVIDERS,
  getProviderChecker,
} from "../providers";

export interface CheckResult {
  provider: ProviderName;
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
  provider: ProviderName,
  username: string
): Effect.Effect<CheckResult, never> {
  const checker = getProviderChecker(provider);

  return checker(username).pipe(
    Effect.map((taken) => ({ provider, taken })),
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
