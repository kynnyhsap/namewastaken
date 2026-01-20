#!/usr/bin/env bun
import { program } from "commander";
import { Effect } from "effect";
import pc from "picocolors";

import { safeParseHandle } from "./schema";
import {
  checkAll,
  checkSingle,
  checkBulk,
  checkProviders,
  checkBulkWithProviders,
} from "./lib/check";
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

    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<username>")}                    ${pc.dim("Check all platforms")}
    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<u1> <u2> ...")}                 ${pc.dim("Check multiple usernames")}
    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<username>")} ${pc.cyan("-p")} ${pc.magenta("<platform>")}    ${pc.dim("Check specific platform")}
    ${pc.green("$")} ${pc.cyan("namewastaken")} ${pc.yellow("<url>")}                          ${pc.dim("Check from profile URL")}

${pc.bold("  Platforms:")}

    ${pc.magenta("x")}          ${pc.dim("twitter")}   X / Twitter
    ${pc.magenta("tiktok")}     ${pc.dim("tt")}        TikTok
    ${pc.magenta("threads")}              Threads
    ${pc.magenta("youtube")}    ${pc.dim("yt")}        YouTube
    ${pc.magenta("instagram")}  ${pc.dim("ig")}        Instagram

${pc.bold("  Options:")}

    ${pc.cyan("-p, --platforms <name>")}         ${pc.dim("Check specific platform(s)")}
    ${pc.cyan("--json")}                         ${pc.dim("Output results as JSON")}
    ${pc.cyan("--no-cache")}                     ${pc.dim("Skip cache, fetch fresh results")}
    ${pc.cyan("-v, --version")}                  ${pc.dim("Show version number")}
    ${pc.cyan("-h, --help")}                     ${pc.dim("Show this help message")}

${pc.bold("  Commands:")}

    ${pc.cyan("platforms")}                      ${pc.dim("List all supported platforms")}
    ${pc.cyan("mcp")}                            ${pc.dim("Start MCP server (Streamable HTTP)")}
    ${pc.cyan("mcp --stdio")}                    ${pc.dim("Start MCP server (STDIO)")}
    ${pc.cyan("cache clear")}                    ${pc.dim("Clear the cache")}
    ${pc.cyan("cache stats")}                    ${pc.dim("Show cache statistics")}

${pc.bold("  Examples:")}

    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast")}
    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast pewdiepie ninja")}
    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast")} ${pc.cyan("-p")} ${pc.magenta("tiktok")}
    ${pc.green("$")} namewastaken ${pc.yellow("mrbeast")} ${pc.cyan("-p")} ${pc.magenta("tt,ig,yt")}
    ${pc.green("$")} namewastaken ${pc.yellow("https://x.com/MrBeast")}
`;

function showHelp() {
  console.log(HELP);
}

async function handleSingleProvider(provider: Provider, username: string, json: boolean) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    console.error(pc.red(`Error: ${parsed.error.issues[0].message}`));
    process.exit(1);
  }

  const start = performance.now();
  const result = await Effect.runPromise(checkSingle(provider, parsed.data));
  const durationMs = Math.round(performance.now() - start);

  console.log(formatSingleProviderResult(provider, parsed.data, result, json, durationMs));
  process.exit(0);
}

async function handleProviders(providerList: Provider[], username: string, json: boolean) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    console.error(pc.red(`Error: ${parsed.error.issues[0].message}`));
    process.exit(1);
  }

  const start = performance.now();
  const result = await Effect.runPromise(checkProviders(providerList, parsed.data));
  const durationMs = Math.round(performance.now() - start);

  if (json) {
    console.log(formatJson(result, durationMs));
  } else {
    console.log(formatTable(result, durationMs));
  }
  process.exit(0);
}

async function handleAllProviders(username: string, json: boolean) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    console.error(pc.red(`Error: ${parsed.error.issues[0].message}`));
    process.exit(1);
  }

  const start = performance.now();
  const result = await Effect.runPromise(checkAll(parsed.data));
  const durationMs = Math.round(performance.now() - start);

  if (json) {
    console.log(formatJson(result, durationMs));
  } else {
    console.log(formatTable(result, durationMs));
  }
  process.exit(0);
}

async function handleBulk(usernames: string[], json: boolean) {
  const validUsernames: string[] = [];

  for (const username of usernames) {
    const parsed = safeParseHandle(username);
    if (!parsed.success) {
      console.error(
        pc.red(`Error: Invalid username "${username}": ${parsed.error.issues[0].message}`),
      );
      process.exit(1);
    }
    validUsernames.push(parsed.data);
  }

  const start = performance.now();
  const results = await Effect.runPromise(checkBulk(validUsernames));
  const durationMs = Math.round(performance.now() - start);

  if (json) {
    console.log(formatBulkJson(results, durationMs));
  } else {
    console.log(formatBulkTable(results, durationMs));
  }
  process.exit(0);
}

async function handleBulkWithPlatforms(
  usernames: string[],
  platformList: Provider[],
  json: boolean,
) {
  const validUsernames: string[] = [];

  for (const username of usernames) {
    const parsed = safeParseHandle(username);
    if (!parsed.success) {
      console.error(
        pc.red(`Error: Invalid username "${username}": ${parsed.error.issues[0].message}`),
      );
      process.exit(1);
    }
    validUsernames.push(parsed.data);
  }

  const start = performance.now();
  const results = await Effect.runPromise(checkBulkWithProviders(validUsernames, platformList));
  const durationMs = Math.round(performance.now() - start);

  if (json) {
    console.log(formatBulkJson(results, durationMs));
  } else {
    console.log(formatBulkTable(results, durationMs, platformList));
  }
  process.exit(0);
}

function parsePlatformOption(value: string): Provider[] {
  const names = value.split(",").map((s) => s.trim());
  const result: Provider[] = [];

  for (const name of names) {
    const provider = resolveProvider(name);
    if (!provider) {
      console.error(pc.red(`Error: Unknown platform "${name}"`));
      console.error(pc.dim(`Available: ${providers.map((p) => p.name).join(", ")}`));
      process.exit(1);
    }
    result.push(provider);
  }

  return result;
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
  .option("-p, --platforms <platforms>", "Check specific platform(s), comma-separated")
  .option("--json", "Output results as JSON")
  .option("--no-cache", "Skip cache, fetch fresh results")
  .action(
    async (inputs: string[], options: { platforms?: string; json?: boolean; cache?: boolean }) => {
      if (options.cache === false) {
        setCacheEnabled(false);
      }

      if (!inputs || inputs.length === 0) {
        showHelp();
        return;
      }

      // If --platforms is provided, use it
      if (options.platforms) {
        const providerList = parsePlatformOption(options.platforms);

        if (inputs.length === 1) {
          const input = inputs[0];

          // Single provider, single username
          if (providerList.length === 1) {
            await handleSingleProvider(providerList[0], input, options.json ?? false);
          } else {
            // Multiple providers, single username
            await handleProviders(providerList, input, options.json ?? false);
          }
        } else {
          // Multiple usernames with --platform - bulk mode for specific platforms
          await handleBulkWithPlatforms(inputs, providerList, options.json ?? false);
        }
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

        // Single username - check all providers
        await handleAllProviders(input, options.json ?? false);
        return;
      }

      // Bulk mode - multiple usernames
      await handleBulk(inputs, options.json ?? false);
    },
  );

// MCP command
program
  .command("mcp")
  .description("Start MCP server for AI assistants")
  .option("-p, --port <port>", "Port to run HTTP server on", "3000")
  .option("--stdio", "Use STDIO transport")
  .option("--sse", "Use SSE transport (legacy)")
  .action(async (options: { port: string; stdio?: boolean; sse?: boolean }) => {
    if (options.stdio) {
      const { startStdioServer } = await import("./mcp");
      await startStdioServer();
    } else if (options.sse) {
      const { startMcpServer } = await import("./mcp");
      await startMcpServer({ port: parseInt(options.port, 10) });
    } else {
      const { startHttpServer } = await import("./mcp");
      await startHttpServer({ port: parseInt(options.port, 10) });
    }
  });

// Platforms command
program
  .command("platforms")
  .description("List all supported platforms")
  .action(() => {
    console.log(`\n${pc.bold("  Supported Platforms:")}\n`);
    for (const p of providers) {
      const aliases = p.aliases.length > 0 ? pc.dim(` (${p.aliases.join(", ")})`) : "";
      console.log(`    ${pc.magenta(p.name.padEnd(10))} ${p.displayName}${aliases}`);
    }
    console.log();
    process.exit(0);
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

program.parse();
