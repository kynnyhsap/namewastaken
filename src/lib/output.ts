import pc from "picocolors";
import { type CheckResult, type CheckAllResult, type BulkCheckResult } from "./check";
import type { Provider } from "../providers";
import { providers } from "../providers";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format a single check result for display
 */
export function formatSingleResult(result: CheckResult, durationMs?: number): string {
  const displayName = result.provider.displayName;
  const timing = durationMs !== undefined ? pc.dim(` (${formatDuration(durationMs)})`) : "";

  if (result.error) {
    return `${pc.yellow("?")} ${displayName}: ${pc.yellow(result.error)}${timing}`;
  }

  if (result.taken) {
    return `${pc.red("x")} ${displayName}: ${pc.red("taken")}${timing}`;
  }

  return `${pc.green("o")} ${displayName}: ${pc.green("available")}${timing}`;
}

/**
 * Format all results as a table
 */
export function formatTable(checkResult: CheckAllResult, durationMs?: number): string {
  const { username, results } = checkResult;

  // Calculate column widths
  const platformWidth = Math.max(
    "Platform".length,
    ...results.map((r) => r.provider.displayName.length),
  );
  const statusWidth = Math.max(
    "Status".length,
    ...results.map((r) => {
      if (r.error) return r.error.length + 2;
      return r.taken ? "x taken".length : "o available".length;
    }),
  );
  const urlWidth = Math.max(
    "URL".length,
    ...results.map((r) => r.provider.profileUrl(username).length),
  );

  const lines: string[] = [];

  // Header
  lines.push(pc.bold(`\nChecking username: ${pc.cyan(username)}\n`));

  // Table top border
  lines.push(
    `+${"-".repeat(platformWidth + 2)}+${"-".repeat(statusWidth + 2)}+${"-".repeat(urlWidth + 2)}+`,
  );

  // Table header
  lines.push(
    `| ${pc.bold("Platform".padEnd(platformWidth))} | ${pc.bold("Status".padEnd(statusWidth))} | ${pc.bold("URL".padEnd(urlWidth))} |`,
  );

  // Header separator
  lines.push(
    `+${"-".repeat(platformWidth + 2)}+${"-".repeat(statusWidth + 2)}+${"-".repeat(urlWidth + 2)}+`,
  );

  // Table rows
  for (const result of results) {
    const displayName = result.provider.displayName;
    const url = result.provider.profileUrl(username);
    let status: string;

    if (result.error) {
      status = pc.yellow(`? ${result.error}`);
    } else if (result.taken) {
      status = pc.red("x taken");
    } else {
      status = pc.green("o available");
    }

    // Calculate visible length (without ANSI codes) for padding
    const visibleStatus = result.error
      ? `? ${result.error}`
      : result.taken
        ? "x taken"
        : "o available";

    lines.push(
      `| ${displayName.padEnd(platformWidth)} | ${status}${" ".repeat(statusWidth - visibleStatus.length)} | ${pc.dim(url.padEnd(urlWidth))} |`,
    );
  }

  // Table bottom border
  lines.push(
    `+${"-".repeat(platformWidth + 2)}+${"-".repeat(statusWidth + 2)}+${"-".repeat(urlWidth + 2)}+`,
  );

  // Summary
  const available = results.filter((r) => !r.taken && !r.error).length;
  const taken = results.filter((r) => r.taken).length;
  const errors = results.filter((r) => r.error).length;

  const summaryParts: string[] = [];
  if (available > 0) summaryParts.push(pc.green(`${available} available`));
  if (taken > 0) summaryParts.push(pc.red(`${taken} taken`));
  if (errors > 0) summaryParts.push(pc.yellow(`${errors} errors`));

  const timing = durationMs !== undefined ? pc.dim(` in ${formatDuration(durationMs)}`) : "";
  lines.push(`\n${summaryParts.join(", ")}${timing}`);

  return lines.join("\n");
}

/**
 * Format results as JSON
 */
export function formatJson(checkResult: CheckAllResult, durationMs?: number): string {
  return JSON.stringify(
    {
      username: checkResult.username,
      results: checkResult.results.map((r) => ({
        provider: r.provider.name,
        displayName: r.provider.displayName,
        taken: r.taken,
        available: !r.taken && !r.error,
        error: r.error ?? null,
      })),
      ...(durationMs !== undefined && { durationMs }),
    },
    null,
    2,
  );
}

/**
 * Format a single provider result
 */
export function formatSingleProviderResult(
  provider: Provider,
  username: string,
  result: CheckResult,
  asJson: boolean,
  durationMs?: number,
): string {
  if (asJson) {
    return JSON.stringify(
      {
        username,
        provider: provider.name,
        displayName: provider.displayName,
        taken: result.taken,
        available: !result.taken && !result.error,
        error: result.error ?? null,
        ...(durationMs !== undefined && { durationMs }),
      },
      null,
      2,
    );
  }

  return formatSingleResult(result, durationMs);
}

/**
 * Format bulk check results as a table
 * Columns: Username | X | TikTok | Threads | YouTube | Instagram
 */
export function formatBulkTable(
  bulkResult: BulkCheckResult,
  durationMs?: number,
  platformList?: Provider[],
): string {
  const { results } = bulkResult;
  const lines: string[] = [];

  // Use provided platforms or all providers
  const platforms = platformList ?? providers;

  // Calculate username column width
  const usernameWidth = Math.max("Username".length, ...results.map((r) => r.username.length));

  // Provider column widths (use short names for compactness)
  const providerWidths = platforms.map((p) => Math.max(p.name.length, "o".length));

  // Header
  lines.push(pc.bold(`\nChecking ${results.length} usernames:\n`));

  // Build header row
  const headerParts = [
    `| ${pc.bold("Username".padEnd(usernameWidth))} |`,
    ...platforms.map((p, i) => ` ${pc.bold(p.name.padEnd(providerWidths[i]))} |`),
  ];
  const headerRow = headerParts.join("");

  // Build separator
  const sepParts = [
    `+${"-".repeat(usernameWidth + 2)}+`,
    ...providerWidths.map((w) => `${"-".repeat(w + 2)}+`),
  ];
  const separator = sepParts.join("");

  lines.push(separator);
  lines.push(headerRow);
  lines.push(separator);

  // Data rows
  let totalAvailable = 0;
  let totalTaken = 0;
  let totalErrors = 0;

  for (const userResult of results) {
    const rowParts = [`| ${userResult.username.padEnd(usernameWidth)} |`];

    for (let i = 0; i < platforms.length; i++) {
      const provider = platforms[i];
      const result = userResult.results.find((r) => r.provider.name === provider.name);
      const width = providerWidths[i];

      let cell: string;
      if (!result) {
        cell = pc.dim("-".padEnd(width));
      } else if (result.error) {
        cell = pc.yellow("?".padEnd(width));
        totalErrors++;
      } else if (result.taken) {
        cell = pc.red("x".padEnd(width));
        totalTaken++;
      } else {
        cell = pc.green("o".padEnd(width));
        totalAvailable++;
      }

      rowParts.push(` ${cell} |`);
    }

    lines.push(rowParts.join(""));
  }

  lines.push(separator);

  // Legend and summary
  lines.push(`\n${pc.green("o")} available  ${pc.red("x")} taken  ${pc.yellow("?")} error`);

  const summaryParts: string[] = [];
  if (totalAvailable > 0) summaryParts.push(pc.green(`${totalAvailable} available`));
  if (totalTaken > 0) summaryParts.push(pc.red(`${totalTaken} taken`));
  if (totalErrors > 0) summaryParts.push(pc.yellow(`${totalErrors} errors`));

  const timing = durationMs !== undefined ? pc.dim(` in ${formatDuration(durationMs)}`) : "";
  lines.push(`\nTotal: ${summaryParts.join(", ")}${timing}`);

  return lines.join("\n");
}

/**
 * Format bulk check results as JSON
 */
export function formatBulkJson(bulkResult: BulkCheckResult, durationMs?: number): string {
  return JSON.stringify(
    {
      usernames: bulkResult.results.map((r) => ({
        username: r.username,
        results: r.results.map((pr) => ({
          provider: pr.provider.name,
          displayName: pr.provider.displayName,
          taken: pr.taken,
          available: !pr.taken && !pr.error,
          error: pr.error ?? null,
        })),
      })),
      ...(durationMs !== undefined && { durationMs }),
    },
    null,
    2,
  );
}
