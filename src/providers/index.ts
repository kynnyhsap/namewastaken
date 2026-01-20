import { Effect } from "effect";
import { checkTikTok, TikTokCheckError } from "./tiktok";
import { checkInstagram, InstagramCheckError } from "./instagram";
import { checkX, XCheckError } from "./x";
import { checkThreads, ThreadsCheckError } from "./threads";
import { checkYouTube, YouTubeCheckError } from "./youtube";

export type ProviderName = "tiktok" | "instagram" | "x" | "threads" | "youtube";

export type CheckError =
  | TikTokCheckError
  | InstagramCheckError
  | XCheckError
  | ThreadsCheckError
  | YouTubeCheckError;

export const PROVIDER_ALIASES: Record<string, ProviderName> = {
  // TikTok
  tiktok: "tiktok",
  tt: "tiktok",
  // Instagram
  instagram: "instagram",
  ig: "instagram",
  // X/Twitter
  x: "x",
  twitter: "x",
  // Threads
  threads: "threads",
  // YouTube
  youtube: "youtube",
  yt: "youtube",
};

// Sorted by provider name length
export const ALL_PROVIDERS: ProviderName[] = [
  "x",
  "tiktok",
  "threads",
  "youtube",
  "instagram",
];

export const PROVIDER_DISPLAY_NAMES: Record<ProviderName, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X/Twitter",
  threads: "Threads",
  youtube: "YouTube",
};

export function resolveProvider(alias: string): ProviderName | null {
  return PROVIDER_ALIASES[alias.toLowerCase()] ?? null;
}

export function getProviderChecker(
  provider: ProviderName
): (username: string) => Effect.Effect<boolean, CheckError> {
  switch (provider) {
    case "tiktok":
      return checkTikTok;
    case "instagram":
      return checkInstagram;
    case "x":
      return checkX;
    case "threads":
      return checkThreads;
    case "youtube":
      return checkYouTube;
  }
}

export {
  checkTikTok,
  checkInstagram,
  checkX,
  checkThreads,
  checkYouTube,
  TikTokCheckError,
  InstagramCheckError,
  XCheckError,
  ThreadsCheckError,
  YouTubeCheckError,
};
