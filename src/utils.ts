import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = process.cwd();

export interface CliOptions {
  input?: string;
  theme?: string;
  limit?: number;
  outputDir?: string;
}

export function parseCliArgs(argv = process.argv.slice(2)): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const [flag, inlineValue] = argument.split("=", 2);
    const nextValue = inlineValue ?? argv[index + 1];

    if (flag === "--input" && nextValue) {
      options.input = nextValue;
      if (inlineValue === undefined) index += 1;
    } else if (flag === "--theme" && nextValue) {
      options.theme = nextValue.trim().toLowerCase();
      if (inlineValue === undefined) index += 1;
    } else if (flag === "--limit" && nextValue) {
      const parsed = Number.parseInt(nextValue, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        throw new Error(`--limit must be a positive integer (received: ${nextValue})`);
      }
      options.limit = parsed;
      if (inlineValue === undefined) index += 1;
    } else if (flag === "--output-dir" && nextValue) {
      options.outputDir = nextValue;
      if (inlineValue === undefined) index += 1;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return options;
}

export function ensureDirectory(directory: string): void {
  fs.mkdirSync(directory, { recursive: true });
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function forcedLineHtml(value: string): string {
  return value
    .split("|")
    .map((line) => `<span class="forced-line">${escapeHtml(line.trim())}</span>`)
    .join("");
}

export function normalizePngFileName(value: string): string {
  const baseName = path.basename(value.trim()).replace(/[\\/:*?"<>|]/g, "_");
  if (!baseName) return "";
  return baseName.toLowerCase().endsWith(".png") ? baseName : `${baseName}.png`;
}

export function coverTitleFileName(value: string): string {
  return normalizePngFileName(value.replaceAll("|", " "));
}

export function toProjectRelative(targetPath: string): string {
  return path.relative(PROJECT_ROOT, targetPath) || ".";
}

export function writeJson(targetPath: string, value: unknown): void {
  ensureDirectory(path.dirname(targetPath));
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function isDirectExecution(moduleUrl: string): boolean {
  return Boolean(process.argv[1]) && fileURLToPath(moduleUrl) === path.resolve(process.argv[1]);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
