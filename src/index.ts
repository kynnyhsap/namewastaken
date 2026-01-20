#!/usr/bin/env bun
import { program } from "commander";
import { Effect } from "effect";
import pc from "picocolors";

import { safeParseHandle } from "./schema";
import { parseUrl, isUrl } from "./lib/url-parser";
import { checkAll, checkSingle } from "./lib/check";
import { formatTable, formatJson, formatSingleProviderResult } from "./lib/output";
import {
  resolveProvider,
  PROVIDER_DISPLAY_NAMES,
  type ProviderName,
} from "./providers";

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
  console.log(`    ${pc.cyan("-v, --version")}                ${pc.dim("Show version number")}`);
  console.log(`    ${pc.cyan("-h, --help")}                   ${pc.dim("Show this help message")}`);
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
  provider: ProviderName,
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
  .action(async (input: string | undefined, options: { json?: boolean }) => {
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
      console.error(pc.red(`Error: Missing username for ${PROVIDER_DISPLAY_NAMES[maybeProvider]}`));
      console.error(pc.dim(`Usage: namewastaken ${input} <username>`));
      process.exit(1);
    }

    // Treat as username - check all providers
    await handleAllProviders(input, options.json ?? false);
  });

// TikTok command
program
  .command("tiktok <username>")
  .alias("tt")
  .description("Check if username is taken on TikTok")
  .option("--json", "Output as JSON")
  .action(async (username: string, options: { json?: boolean }) => {
    await handleSingleProvider("tiktok", username, options.json ?? false);
  });

// Instagram command
program
  .command("instagram <username>")
  .alias("ig")
  .description("Check if username is taken on Instagram")
  .option("--json", "Output as JSON")
  .action(async (username: string, options: { json?: boolean }) => {
    await handleSingleProvider("instagram", username, options.json ?? false);
  });

// X/Twitter command
program
  .command("x <username>")
  .alias("twitter")
  .description("Check if username is taken on X/Twitter")
  .option("--json", "Output as JSON")
  .action(async (username: string, options: { json?: boolean }) => {
    await handleSingleProvider("x", username, options.json ?? false);
  });

// Threads command
program
  .command("threads <username>")
  .description("Check if username is taken on Threads")
  .option("--json", "Output as JSON")
  .action(async (username: string, options: { json?: boolean }) => {
    await handleSingleProvider("threads", username, options.json ?? false);
  });

// YouTube command
program
  .command("youtube <username>")
  .alias("yt")
  .description("Check if username is taken on YouTube")
  .option("--json", "Output as JSON")
  .action(async (username: string, options: { json?: boolean }) => {
    await handleSingleProvider("youtube", username, options.json ?? false);
  });

program.parse();
