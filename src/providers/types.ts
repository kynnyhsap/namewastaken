import { Effect, Data } from "effect";

export class ProviderCheckError extends Data.TaggedError("ProviderCheckError")<{
  provider: string;
  reason: string;
}> {}

export interface Provider {
  /** Unique identifier for the provider */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** CLI aliases (e.g., "tt" for tiktok) */
  aliases: string[];
  /** Check if a username is taken */
  check: (username: string) => Effect.Effect<boolean, ProviderCheckError>;
  /** Build profile URL for a username */
  profileUrl: (username: string) => string;
  /** Parse a URL and extract username if it matches this provider */
  parseUrl: (url: string) => string | null;
}
