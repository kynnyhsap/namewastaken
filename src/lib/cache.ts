import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
// Provider name is just a string identifier

const CACHE_DIR = join(homedir(), ".namewastaken");
const CACHE_FILE = join(CACHE_DIR, "cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  taken: boolean;
  timestamp: number;
}

interface CacheData {
  [provider: string]: {
    [username: string]: CacheEntry;
  };
}

let cacheEnabled = true;

export function setCacheEnabled(enabled: boolean) {
  cacheEnabled = enabled;
}

export function isCacheEnabled(): boolean {
  return cacheEnabled;
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readCache(): CacheData {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch {
    // Ignore errors, return empty cache
  }
  return {};
}

function writeCache(data: CacheData) {
  try {
    ensureCacheDir();
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Ignore write errors
  }
}

export function getCached(provider: string, username: string): boolean | null {
  if (!cacheEnabled) return null;

  const cache = readCache();
  const entry = cache[provider]?.[username];

  if (!entry) return null;

  // Check if cache is expired
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    return null;
  }

  return entry.taken;
}

export function setCache(provider: string, username: string, taken: boolean) {
  if (!cacheEnabled) return;

  const cache = readCache();

  if (!cache[provider]) {
    cache[provider] = {};
  }

  cache[provider][username] = {
    taken,
    timestamp: Date.now(),
  };

  writeCache(cache);
}

export function clearCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      writeFileSync(CACHE_FILE, "{}");
    }
  } catch {
    // Ignore errors
  }
}

export function getCacheStats(): { entries: number; providers: string[] } {
  const cache = readCache();
  const providers = Object.keys(cache);
  let entries = 0;

  for (const provider of providers) {
    entries += Object.keys(cache[provider] || {}).length;
  }

  return { entries, providers };
}
