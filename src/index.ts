#!/usr/bin/env bun
import { program } from "commander";
import { Effect } from "effect";
import pc from "picocolors";

import { safeParseHandle } from "./schema";
import { checkAll, checkSingle, checkBulk } from "./lib/check";
import {
  formatTable,
  formatJson,
  formatSingleProviderResult,
  formatBulkTable,
  formatBulkJson,
} from "./lib/output";
import { setCacheEnabled, clearCache, getCacheStats } from "./lib/cache";
import { providers, resolveProvider, parseUrl, isUrl, type Provider } from "./providers";

const VERSION = "1.0.0";

const HELP = `
${pc.bold(pc.cyan("  namewastaken"))}${pc.dim(` v${VERSION}`)}
${pc.dim("  Check if a username is taken on social platforms")}

${pc.bold("  Usage:")}

    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<username>")}              ${pc.dim("Check all platforms")}
    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<u1> <u2> ...")}           ${pc.dim("Check multiple usernames")}
    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.magenta("<provider>")} ${pc.yellow("<username>")}   ${pc.dim("Check single platform")}
    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<url>")}                    ${pc.dim("Check from profile URL")}

${pc.bold("  Providers:")}

    ${pc.magenta("x")}          ${pc.dim("twitter")}   X / Twitter
    ${pc.magenta("tiktok")}     ${pc.dim("tt")}        TikTok
    ${pc.magenta("threads")}              Threads
    ${pc.magenta("youtube")}    ${pc.dim("yt")}        YouTube
    ${pc.magenta("instagram")}  ${pc.dim("ig")}        Instagram

${pc.bold("  Options:")}

    ${pc.cyan("--json")}                       ${pc.dim("Output results as JSON")}
    ${pc.cyan("--no-cache")}                   ${pc.dim("Skip cache, fetch fresh results")}
    ${pc.cyan("-v, --version")}                ${pc.dim("Show version number")}
    ${pc.cyan("-h, --help")}                   ${pc.dim("Show this help message")}

${pc.bold("  Commands:")}

    ${pc.cyan("mcp")}                          ${pc.dim("Start MCP server")}
    ${pc.cyan("cache clear")}                  ${pc.dim("Clear the cache")}
    ${pc.cyan("cache stats")}                  ${pc.dim("Show cache statistics")}

${pc.bold("  Examples:")}

    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast")}
    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast pewdiepie ninja")}
    ${pc.green("$")} namewastaken ${pc.magenta("tt")} ${pc.yellow("mrbeast")}
    ${pc.green("$")} namewastaken ${pc.magenta("ig")} ${pc.yellow("mrbeast")} ${pc.cyan("--json")}
    ${pc.green("$")} namewastaken ${pc.yellow("https://x.com/MrBeast")}
`;

function showHelp() {
  console.log(HELP);
}

async function handleSingleProvider(provider: Provider, username: string, json: boolean) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    console.error(pc.red(`Error: ${parsed.error.errors[0].message}`));
    process.exit(1);
  }

  const result = await Effect.runPromise(checkSingle(provider, parsed.data));
  console.log(formatSingleProviderResult(provider, parsed.data, result, json));
  process.exit(0);
}

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

async function handleBulk(usernames: string[], json: boolean) {
  const validUsernames: string[] = [];

  for (const username of usernames) {
    const parsed = safeParseHandle(username);
    if (!parsed.success) {
      console.error(
        pc.red(`Error: Invalid username "${username}": ${parsed.error.errors[0].message}`),
      );
      process.exit(1);
    }
    validUsernames.push(parsed.data);
  }

  const results = await Effect.runPromise(checkBulk(validUsernames));

  if (json) {
    console.log(formatBulkJson(results));
  } else {
    console.log(formatBulkTable(results));
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
  .argument("[inputs...]", "Username(s) or URL to check")
  .option("--json", "Output results as JSON")
  .option("--no-cache", "Skip cache, fetch fresh results")
  .action(async (inputs: string[], options: { json?: boolean; cache?: boolean }) => {
    if (options.cache === false) {
      setCacheEnabled(false);
    }

    if (!inputs || inputs.length === 0) {
      showHelp();
      return;
    }

    // Single input
    if (inputs.length === 1) {
      const input = inputs[0];

      // Check if input is a URL
      if (isUrl(input)) {
        const parsed = parseUrl(input);
        if (!parsed) {
          console.error(pc.red("Error: Unsupported URL format"));
          console.error(
            pc.dim("Supported platforms: TikTok, Instagram, X/Twitter, Threads, YouTube"),
          );
          process.exit(1);
        }
        await handleSingleProvider(parsed.provider, parsed.username, options.json ?? false);
        return;
      }

      // Check if input might be a provider alias
      const maybeProvider = resolveProvider(input);
      if (maybeProvider) {
        console.error(pc.red(`Error: Missing username for ${maybeProvider.displayName}`));
        console.error(pc.dim(`Usage: namewastaken ${input} <username>`));
        process.exit(1);
      }

      // Single username - check all providers
      await handleAllProviders(input, options.json ?? false);
      return;
    }

    // Multiple inputs - check if first is a provider
    const maybeProvider = resolveProvider(inputs[0]);
    if (maybeProvider && inputs.length === 2) {
      // Provider + username
      await handleSingleProvider(maybeProvider, inputs[1], options.json ?? false);
      return;
    }

    // Bulk mode - multiple usernames
    await handleBulk(inputs, options.json ?? false);
  });

// MCP command
program
  .command("mcp")
  .description("Start MCP server for AI assistants")
  .option("-p, --port <port>", "Port to run server on", "3000")
  .action(async (options: { port: string }) => {
    const { startMcpServer } = await import("./mcp");
    await startMcpServer({ port: parseInt(options.port, 10) });
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
      console.log(`
${pc.bold("  Cache Statistics")}

    ${pc.dim("Entries:")}     ${stats.entries}
    ${pc.dim("Providers:")}   ${stats.providers.length > 0 ? stats.providers.join(", ") : "none"}
    ${pc.dim("Location:")}    ~/.namewastaken/cache.json
    ${pc.dim("TTL:")}         24 hours
`);
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
