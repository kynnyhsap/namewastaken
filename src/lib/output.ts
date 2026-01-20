import pc from "picocolors";
import { type CheckResult, type CheckAllResult } from "./check";
import type { Provider } from "../providers";

/**
 * Format a single check result for display
 */
export function formatSingleResult(result: CheckResult): string {
  const displayName = result.provider.displayName;

  if (result.error) {
    return `${pc.yellow("?")} ${displayName}: ${pc.yellow(result.error)}`;
  }

  if (result.taken) {
    return `${pc.red("x")} ${displayName}: ${pc.red("taken")}`;
  }

  return `${pc.green("o")} ${displayName}: ${pc.green("available")}`;
}

/**
 * Format all results as a table
 */
export function formatTable(checkResult: CheckAllResult): string {
  const { username, results } = checkResult;

  // Calculate column widths
  const platformWidth = Math.max(
    "Platform".length,
    ...results.map((r) => r.provider.displayName.length)
  );
  const statusWidth = Math.max(
    "Status".length,
    ...results.map((r) => {
      if (r.error) return r.error.length + 2;
      return r.taken ? "x taken".length : "o available".length;
    })
  );
  const urlWidth = Math.max(
    "URL".length,
    ...results.map((r) => r.provider.profileUrl(username).length)
  );

  const lines: string[] = [];

  // Header
  lines.push(pc.bold(`\nChecking username: ${pc.cyan(username)}\n`));

  // Table top border
  lines.push(`+${"-".repeat(platformWidth + 2)}+${"-".repeat(statusWidth + 2)}+${"-".repeat(urlWidth + 2)}+`);

  // Table header
  lines.push(
    `| ${pc.bold("Platform".padEnd(platformWidth))} | ${pc.bold("Status".padEnd(statusWidth))} | ${pc.bold("URL".padEnd(urlWidth))} |`
  );

  // Header separator
  lines.push(`+${"-".repeat(platformWidth + 2)}+${"-".repeat(statusWidth + 2)}+${"-".repeat(urlWidth + 2)}+`);

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
      `| ${displayName.padEnd(platformWidth)} | ${status}${" ".repeat(statusWidth - visibleStatus.length)} | ${pc.dim(url.padEnd(urlWidth))} |`
    );
  }

  // Table bottom border
  lines.push(`+${"-".repeat(platformWidth + 2)}+${"-".repeat(statusWidth + 2)}+${"-".repeat(urlWidth + 2)}+`);

  // Summary
  const available = results.filter((r) => !r.taken && !r.error).length;
  const taken = results.filter((r) => r.taken).length;
  const errors = results.filter((r) => r.error).length;

  const summaryParts: string[] = [];
  if (available > 0)
    summaryParts.push(pc.green(`${available} available`));
  if (taken > 0) summaryParts.push(pc.red(`${taken} taken`));
  if (errors > 0) summaryParts.push(pc.yellow(`${errors} errors`));

  lines.push(`\n${summaryParts.join(", ")}`);

  return lines.join("\n");
}

/**
 * Format results as JSON
 */
export function formatJson(checkResult: CheckAllResult): string {
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
    },
    null,
    2
  );
}

/**
 * Format a single provider result
 */
export function formatSingleProviderResult(
  provider: Provider,
  username: string,
  result: CheckResult,
  asJson: boolean
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
      },
      null,
      2
    );
  }

  return formatSingleResult(result);
}
