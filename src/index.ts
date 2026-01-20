#!/usr/bin/env bun
import { program } from "commander";
import { Effect } from "effect";
import pc from "picocolors";

import { safeParseHandle } from "./schema";
import { checkAll, checkSingle } from "./lib/check";
import { formatTable, formatJson, formatSingleProviderResult } from "./lib/output";
import { setCacheEnabled, clearCache, getCacheStats } from "./lib/cache";
import { providers, resolveProvider, parseUrl, isUrl, type Provider } from "./providers";

const VERSION = "1.0.0";

// Custom help display
function showHelp() {
  console.log();
  console.log(pc.bold(pc.cyan("  namewastaken")) + pc.dim(` v${VERSION}`));
  console.log(pc.dim("  Check if a username is taken on social platforms"));
  console.log();

  console.log(pc.bold("  Usage:"));
  console.log();
  console.log(`    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<username>")}              ${pc.dim("Check all platforms")}`);
  console.log(`    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.magenta("<provider>")} ${pc.yellow("<username>")}   ${pc.dim("Check single platform")}`);
  console.log(`    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<url>")}                    ${pc.dim("Check from profile URL")}`);
  console.log();

  console.log(pc.bold("  Providers:"));
  console.log();
  console.log(`    ${pc.magenta("x")}          ${pc.dim("twitter")}   X / Twitter`);
  console.log(`    ${pc.magenta("tiktok")}     ${pc.dim("tt")}        TikTok`);
  console.log(`    ${pc.magenta("threads")}              Threads`);
  console.log(`    ${pc.magenta("youtube")}    ${pc.dim("yt")}        YouTube`);
  console.log(`    ${pc.magenta("instagram")}  ${pc.dim("ig")}        Instagram`);
  console.log();

  console.log(pc.bold("  Options:"));
  console.log();
  console.log(`    ${pc.cyan("--json")}                       ${pc.dim("Output results as JSON")}`);
  console.log(`    ${pc.cyan("--no-cache")}                   ${pc.dim("Skip cache, fetch fresh results")}`);
  console.log(`    ${pc.cyan("-v, --version")}                ${pc.dim("Show version number")}`);
  console.log(`    ${pc.cyan("-h, --help")}                   ${pc.dim("Show this help message")}`);
  console.log();

  console.log(pc.bold("  Commands:"));
  console.log();
  console.log(`    ${pc.cyan("cache clear")}                  ${pc.dim("Clear the cache")}`);
  console.log(`    ${pc.cyan("cache stats")}                  ${pc.dim("Show cache statistics")}`);
  console.log();

  console.log(pc.bold("  Examples:"));
  console.log();
  console.log(`    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast")}`);
  console.log(`    ${pc.green("$")} namewastaken ${pc.magenta("tt")} ${pc.yellow("mrbeast")}`);
  console.log(`    ${pc.green("$")} namewastaken ${pc.magenta("ig")} ${pc.yellow("mrbeast")} ${pc.cyan("--json")}`);
  console.log(`    ${pc.green("$")} namewastaken ${pc.yellow("https://x.com/MrBeast")}`);
  console.log();
}

// Helper function to handle a single provider check
async function handleSingleProvider(
  provider: Provider,
  username: string,
  json: boolean
) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    console.error(pc.red(`Error: ${parsed.error.errors[0].message}`));
    process.exit(1);
  }

  const result = await Effect.runPromise(checkSingle(provider, parsed.data));
  console.log(formatSingleProviderResult(provider, parsed.data, result, json));
  process.exit(0);
}

// Helper function to handle all providers check
async function handleAllProviders(username: string, json: boolean) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    console.error(pc.red(`Error: ${parsed.error.errors[0].message}`));
    process.exit(1);
  }

  const result = await Effect.runPromise(checkAll(parsed.data));

  if (json) {
    console.log(formatJson(result));
  } else {
    console.log(formatTable(result));
  }
  process.exit(0);
}

program
  .name("namewastaken")
  .description("Check if a username is taken on social platforms")
  .version(VERSION, "-v, --version", "Show version number")
  .helpOption("-h, --help", "Show help message")
  .addHelpCommand(false)
  .configureHelp({ formatHelp: () => "" })
  .on("--help", showHelp);

// Default command - check all providers or handle URL
program
  .argument("[input]", "Username or URL to check")
  .option("--json", "Output results as JSON")
  .option("--no-cache", "Skip cache, fetch fresh results")
  .action(async (input: string | undefined, options: { json?: boolean; cache?: boolean }) => {
    // Handle --no-cache flag
    if (options.cache === false) {
      setCacheEnabled(false);
    }
    if (!input) {
      showHelp();
      return;
    }

    // Check if input is a URL
    if (isUrl(input)) {
      const parsed = parseUrl(input);
      if (!parsed) {
        console.error(pc.red("Error: Unsupported URL format"));
        console.error(
          pc.dim("Supported platforms: TikTok, Instagram, X/Twitter, Threads, YouTube")
        );
        process.exit(1);
      }

      await handleSingleProvider(parsed.provider, parsed.username, options.json ?? false);
      return;
    }

    // Check if input might be a provider alias (for backwards compatibility with old syntax)
    const maybeProvider = resolveProvider(input);
    if (maybeProvider) {
      // This means user typed just the provider name without a username
      console.error(pc.red(`Error: Missing username for ${maybeProvider.displayName}`));
      console.error(pc.dim(`Usage: namewastaken ${input} <username>`));
      process.exit(1);
    }

    // Treat as username - check all providers
    await handleAllProviders(input, options.json ?? false);
  });

// Cache command
program
  .command("cache <action>")
  .description("Manage the cache (clear, stats)")
  .action((action: string) => {
    if (action === "clear") {
      clearCache();
      console.log(pc.green("Cache cleared successfully"));
      process.exit(0);
    } else if (action === "stats") {
      const stats = getCacheStats();
      console.log();
      console.log(pc.bold("  Cache Statistics"));
      console.log();
      console.log(`    ${pc.dim("Entries:")}     ${stats.entries}`);
      console.log(`    ${pc.dim("Providers:")}   ${stats.providers.length > 0 ? stats.providers.join(", ") : "none"}`);
      console.log(`    ${pc.dim("Location:")}    ~/.namewastaken/cache.json`);
      console.log(`    ${pc.dim("TTL:")}         24 hours`);
      console.log();
      process.exit(0);
    } else {
      console.error(pc.red(`Unknown cache action: ${action}`));
      console.error(pc.dim("Available actions: clear, stats"));
      process.exit(1);
    }
  });

// Generate provider commands dynamically
for (const provider of providers) {
  const cmd = program
    .command(`${provider.name} <username>`)
    .description(`Check if username is taken on ${provider.displayName}`)
    .option("--json", "Output as JSON")
    .option("--no-cache", "Skip cache")
    .action(async (username: string, options: { json?: boolean; cache?: boolean }) => {
      if (options.cache === false) setCacheEnabled(false);
      await handleSingleProvider(provider, username, options.json ?? false);
    });

  // Add aliases (skip the first one which is the provider name itself)
  for (const alias of provider.aliases.slice(1)) {
    cmd.alias(alias);
  }
}

program.parse();
