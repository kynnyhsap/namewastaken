#!/usr/bin/env bun
import { program } from "commander";
import { Effect } from "effect";
import pc from "picocolors";

import pkg from "../package.json";

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
import { providers, resolveProvider, parseUrl, isUrl, type Provider } from "./providers";
import { safeParseHandle } from "./schema";

const VERSION = pkg.version;

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
    ${pc.magenta("facebook")}   ${pc.dim("fb")}        Facebook
    ${pc.magenta("telegram")}   ${pc.dim("tg")}        Telegram
    ${pc.magenta("github")}     ${pc.dim("gh")}        GitHub

${pc.bold("  Options:")}

    ${pc.cyan("-j, --json")}                     ${pc.dim("Output results as JSON")}
    ${pc.cyan("-p, --platforms <name>")}         ${pc.dim("Check specific platform(s)")}
    ${pc.cyan("-q, --quiet")}                    ${pc.dim("No output, exit 0 if available")}
    ${pc.cyan("-v, --version")}                  ${pc.dim("Show version number")}
    ${pc.cyan("-h, --help")}                     ${pc.dim("Show this help message")}

${pc.bold("  Commands:")}

    ${pc.cyan("platforms")}                      ${pc.dim("List all supported platforms")}
    ${pc.cyan("mcp")}                            ${pc.dim("Start MCP server (STDIO)")}
    ${pc.cyan("mcp --http")}                     ${pc.dim("Start MCP server (HTTP)")}

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

interface OutputOptions {
  json?: boolean;
  quiet?: boolean;
}

async function handleSingleProvider(provider: Provider, username: string, opts: OutputOptions) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    if (!opts.quiet) console.error(pc.red(`Error: ${parsed.error.issues[0].message}`));
    process.exit(1);
  }

  const start = performance.now();
  const result = await Effect.runPromise(checkSingle(provider, parsed.data));
  const durationMs = Math.round(performance.now() - start);

  if (opts.quiet) {
    // Exit 0 if available, 1 if taken
    process.exit(result.taken ? 1 : 0);
  }

  console.log(
    formatSingleProviderResult(provider, parsed.data, result, opts.json ?? false, durationMs),
  );
  process.exit(0);
}

async function handleProviders(providerList: Provider[], username: string, opts: OutputOptions) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    if (!opts.quiet) console.error(pc.red(`Error: ${parsed.error.issues[0].message}`));
    process.exit(1);
  }

  const start = performance.now();
  const result = await Effect.runPromise(checkProviders(providerList, parsed.data));
  const durationMs = Math.round(performance.now() - start);

  if (opts.quiet) {
    // Exit 0 if available on ALL platforms, 1 if taken on ANY
    const anyTaken = result.results.some((r) => r.taken);
    process.exit(anyTaken ? 1 : 0);
  }

  if (opts.json) {
    console.log(formatJson(result, durationMs));
  } else {
    console.log(formatTable(result, durationMs));
  }
  process.exit(0);
}

async function handleAllProviders(username: string, opts: OutputOptions) {
  const parsed = safeParseHandle(username);
  if (!parsed.success) {
    if (!opts.quiet) console.error(pc.red(`Error: ${parsed.error.issues[0].message}`));
    process.exit(1);
  }

  const start = performance.now();
  const result = await Effect.runPromise(checkAll(parsed.data));
  const durationMs = Math.round(performance.now() - start);

  if (opts.quiet) {
    // Exit 0 if available on ALL platforms, 1 if taken on ANY
    const anyTaken = result.results.some((r) => r.taken);
    process.exit(anyTaken ? 1 : 0);
  }

  if (opts.json) {
    console.log(formatJson(result, durationMs));
  } else {
    console.log(formatTable(result, durationMs));
  }
  process.exit(0);
}

async function handleBulk(usernames: string[], opts: OutputOptions) {
  const validUsernames: string[] = [];

  for (const username of usernames) {
    const parsed = safeParseHandle(username);
    if (!parsed.success) {
      if (!opts.quiet) {
        console.error(
          pc.red(`Error: Invalid username "${username}": ${parsed.error.issues[0].message}`),
        );
      }
      process.exit(1);
    }
    validUsernames.push(parsed.data);
  }

  const start = performance.now();
  const results = await Effect.runPromise(checkBulk(validUsernames));
  const durationMs = Math.round(performance.now() - start);

  if (opts.quiet) {
    // Exit 0 if ALL usernames available on ALL platforms, 1 if any taken
    const anyTaken = results.results.some((r) => r.results.some((pr) => pr.taken));
    process.exit(anyTaken ? 1 : 0);
  }

  if (opts.json) {
    console.log(formatBulkJson(results, durationMs));
  } else {
    console.log(formatBulkTable(results, durationMs));
  }
  process.exit(0);
}

async function handleBulkWithPlatforms(
  usernames: string[],
  platformList: Provider[],
  opts: OutputOptions,
) {
  const validUsernames: string[] = [];

  for (const username of usernames) {
    const parsed = safeParseHandle(username);
    if (!parsed.success) {
      if (!opts.quiet) {
        console.error(
          pc.red(`Error: Invalid username "${username}": ${parsed.error.issues[0].message}`),
        );
      }
      process.exit(1);
    }
    validUsernames.push(parsed.data);
  }

  const start = performance.now();
  const results = await Effect.runPromise(checkBulkWithProviders(validUsernames, platformList));
  const durationMs = Math.round(performance.now() - start);

  if (opts.quiet) {
    // Exit 0 if ALL usernames available on ALL platforms, 1 if any taken
    const anyTaken = results.results.some((r) => r.results.some((pr) => pr.taken));
    process.exit(anyTaken ? 1 : 0);
  }

  if (opts.json) {
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
  .option("-j, --json", "Output results as JSON")
  .option("-q, --quiet", "No output, exit 0 if available, 1 if taken")
  .action(
    async (inputs: string[], options: { platforms?: string; json?: boolean; quiet?: boolean }) => {
      const opts: OutputOptions = { json: options.json, quiet: options.quiet };

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
            await handleSingleProvider(providerList[0], input, opts);
          } else {
            // Multiple providers, single username
            await handleProviders(providerList, input, opts);
          }
        } else {
          // Multiple usernames with --platform - bulk mode for specific platforms
          await handleBulkWithPlatforms(inputs, providerList, opts);
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
            if (!opts.quiet) {
              console.error(pc.red("Error: Unsupported URL format"));
              console.error(
                pc.dim("Supported platforms: TikTok, Instagram, X/Twitter, Threads, YouTube"),
              );
            }
            process.exit(1);
          }
          await handleSingleProvider(parsed.provider, parsed.username, opts);
          return;
        }

        // Single username - check all providers
        await handleAllProviders(input, opts);
        return;
      }

      // Bulk mode - multiple usernames
      await handleBulk(inputs, opts);
    },
  );

// MCP command
program
  .command("mcp")
  .description("Start MCP server for AI assistants")
  .option("--http", "Use HTTP transport instead of STDIO")
  .option("--port <port>", "Port for HTTP server (auto-selects if not specified)")
  .action(async (options: { http?: boolean; port?: string }) => {
    if (options.http) {
      const { startMcpServer } = await import("./mcp");
      await startMcpServer({ port: options.port ? parseInt(options.port, 10) : undefined });
    } else {
      const { startStdioServer } = await import("./mcp");
      await startStdioServer();
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

program.parse();
