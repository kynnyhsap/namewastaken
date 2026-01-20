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
