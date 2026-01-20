import type { Provider } from "./types";

import { facebook } from "./facebook";
import { instagram } from "./instagram";
import { telegram } from "./telegram";
import { threads } from "./threads";
import { tiktok } from "./tiktok";
import { x } from "./x";
import { youtube } from "./youtube";

export type { Provider } from "./types";
export { ProviderCheckError } from "./types";

/** All registered providers */
export const providers: Provider[] = [x, tiktok, threads, youtube, instagram, facebook, telegram];

/** Map of provider name to provider */
const providersByName = new Map(providers.map((p) => [p.name, p]));

/** Map of alias to provider */
const providersByAlias = new Map(providers.flatMap((p) => p.aliases.map((alias) => [alias, p])));

/** Get provider by name */
export function getProvider(name: string): Provider | undefined {
  return providersByName.get(name);
}

/** Resolve provider from name or alias */
export function resolveProvider(nameOrAlias: string): Provider | undefined {
  return providersByAlias.get(nameOrAlias.toLowerCase());
}

/** Parse a URL and return the matching provider and username */
export function parseUrl(url: string): { provider: Provider; username: string } | null {
  for (const provider of providers) {
    const username = provider.parseUrl(url);
    if (username) {
      return { provider, username };
    }
  }
  return null;
}

/** Check if a string is a URL */
export function isUrl(input: string): boolean {
  return input.startsWith("http://") || input.startsWith("https://");
}

// Re-export individual providers for convenience
export { tiktok } from "./tiktok";
export { instagram } from "./instagram";
export { x } from "./x";
export { threads } from "./threads";
export { youtube } from "./youtube";
export { facebook } from "./facebook";
export { telegram } from "./telegram";
