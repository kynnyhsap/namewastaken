import { mock } from "bun:test";

/**
 * Creates a properly typed fetch mock that satisfies Bun's fetch type.
 * This handles the `preconnect` property that Bun's fetch type requires.
 */
export function mockFetch<T extends (...args: never[]) => Promise<Response | never>>(
  implementation: T,
): typeof fetch {
  const mockedFn = mock(implementation) as unknown as typeof fetch;
  mockedFn.preconnect = mock(() => {});
  return mockedFn;
}

/**
 * Generates a random username that is guaranteed to be available.
 * Uses a combination of timestamp and random characters.
 */
export function generateRandomUsername(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `test_${timestamp}_${random}`;
}

/** A guaranteed available username for e2e tests (generated fresh each test run) */
export const AVAILABLE_USERNAME = generateRandomUsername();
