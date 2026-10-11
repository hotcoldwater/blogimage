import fs from "node:fs";
import path from "node:path";
import type { LoadedWorkbook } from "./loadExcel.js";
import { loadWorkbooks } from "./loadExcel.js";
import {
  normalizeWorkbooks,
  RENDER_REQUIRED_COLUMNS,
  REQUIRED_COLUMNS,
  type CoverRow,
} from "./normalizeData.js";
import { isSupportedIcon } from "./iconRegistry.js";
import { isContentTheme } from "./themes.js";
import {
  errorMessage,
  isDirectExecution,
  normalizePngFileName,
  parseCliArgs,
  PROJECT_ROOT,
  toProjectRelative,
  writeJson,
} from "./utils.js";

export type IssueSeverity = "error" | "warning";
export type IssueType =
  | "missing_columns"
  | "missing_value"
  | "unsupported_theme"
  | "unsupported_icon"
  | "duplicate_file_name"
  | "likely_title_overflow"
  | "likely_subtitle_overflow";

export interface ValidationIssue {
  severity: IssueSeverity;
  type: IssueType;
  message: string;
  source_file?: string;
  source_row?: number;
  id?: string;
  fields?: string[];
}

export interface ValidationReport {
  generated_at: string;
  input_files: string[];
  workbook_count: number;
  row_count: number;
  error_count: number;
  warning_count: number;
  issue_count: number;
  issues: ValidationIssue[];
}

function visibleLength(value: string): number {
  return Array.from(value.replaceAll(/\s/g, "")).length;
}

function lineLengths(value: string): number[] {
  return value.split("|").map(visibleLength);
}

export function collectValidationIssues(workbooks: LoadedWorkbook[], rows: CoverRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const workbook of workbooks) {
    const missingColumns = REQUIRED_COLUMNS.filter((column) => !workbook.headers.includes(column));
    if (missingColumns.length > 0) {
      issues.push({
        severity: "error",
        type: "missing_columns",
        message: `Missing required columns: ${missingColumns.join(", ")}`,
        source_file: workbook.fileName,
        fields: [...missingColumns],
      });
    }
  }

  for (const row of rows) {
    const missingValues = RENDER_REQUIRED_COLUMNS.filter((column) => row[column] === "");
    if (missingValues.length > 0) {
      issues.push({
        severity: "error",
        type: "missing_value",
        message: `Missing rendering values: ${missingValues.join(", ")}`,
        source_file: row.source_file,
        source_row: row.source_row,
        id: row.id,
        fields: [...missingValues],
      });
    }

    if (row.theme && !isContentTheme(row.theme)) {
      issues.push({
        severity: "warning",
        type: "unsupported_theme",
        message: `Unsupported theme \"${row.original_theme}\"; output will use the misc theme.`,
        source_file: row.source_file,
        source_row: row.source_row,
        id: row.id,
        fields: ["theme"],
      });
    }

    if (row.icon && !isSupportedIcon(row.icon)) {
      issues.push({
        severity: "warning",
        type: "unsupported_icon",
        message: `Unsupported icon \"${row.icon}\"; the icon area will be blank.`,
        source_file: row.source_file,
        source_row: row.source_row,
        id: row.id,
        fields: ["icon"],
      });
    }

    const titleLines = lineLengths(row.cover_title);
    if (titleLines.length > 4 || Math.max(0, ...titleLines) > 19 || visibleLength(row.cover_title) > 52) {
      issues.push({
        severity: "warning",
        type: "likely_title_overflow",
        message: `Title may be too long (${titleLines.length} forced line(s), longest line ${Math.max(0, ...titleLines)} characters).`,
        source_file: row.source_file,
        source_row: row.source_row,
        id: row.id,
        fields: ["cover_title"],
      });
    }

    const subtitleLines = lineLengths(row.subtitle);
    if (subtitleLines.length > 4 || Math.max(0, ...subtitleLines) > 24 || visibleLength(row.subtitle) > 72) {
      issues.push({
        severity: "warning",
        type: "likely_subtitle_overflow",
        message: `Subtitle may be too long (${subtitleLines.length} forced line(s), longest line ${Math.max(0, ...subtitleLines)} characters).`,
        source_file: row.source_file,
        source_row: row.source_row,
        id: row.id,
        fields: ["subtitle"],
      });
    }
  }

  const byFileName = new Map<string, CoverRow[]>();
  for (const row of rows) {
    const normalized = normalizePngFileName(row.file_name).toLocaleLowerCase("en-US");
    if (!normalized) continue;
    const matches = byFileName.get(normalized) ?? [];
    matches.push(row);
    byFileName.set(normalized, matches);
  }
  for (const [fileName, matches] of byFileName) {
    if (matches.length < 2) continue;
    for (const row of matches) {
      issues.push({
        severity: "error",
        type: "duplicate_file_name",
        message: `Duplicate file_name \"${fileName}\" appears ${matches.length} times.`,
        source_file: row.source_file,
        source_row: row.source_row,
        id: row.id,
        fields: ["file_name"],
      });
    }
  }

  return issues;
}

export function createValidationReport(workbooks: LoadedWorkbook[], rows: CoverRow[]): ValidationReport {
  const issues = collectValidationIssues(workbooks, rows);
  return {
    generated_at: new Date().toISOString(),
    input_files: workbooks.map((workbook) => toProjectRelative(workbook.filePath)),
    workbook_count: workbooks.length,
    row_count: rows.length,
    error_count: issues.filter((issue) => issue.severity === "error").length,
    warning_count: issues.filter((issue) => issue.severity === "warning").length,
    issue_count: issues.length,
    issues,
  };
}

function markdownReport(report: ValidationReport): string {
  const lines = [
    "# Validation report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `- Workbooks: ${report.workbook_count}`,
    `- Data rows: ${report.row_count}`,
    `- Errors: ${report.error_count}`,
    `- Warnings: ${report.warning_count}`,
    "",
    "## Inputs",
    "",
    ...report.input_files.map((file) => `- \`${file}\``),
    "",
    "## Issues",
    "",
  ];

  if (report.issues.length === 0) {
    lines.push("No validation issues found.", "");
  } else {
    lines.push("| Severity | Type | Source | Row | ID | Message |", "| --- | --- | --- | ---: | --- | --- |");
    for (const issue of report.issues) {
      const clean = issue.message.replaceAll("|", "\\|");
      lines.push(
        `| ${issue.severity} | ${issue.type} | ${issue.source_file ?? ""} | ${issue.source_row ?? ""} | ${issue.id ?? ""} | ${clean} |`,
      );
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export function writeValidationReport(report: ValidationReport): void {
  const reportsDirectory = path.join(PROJECT_ROOT, "reports");
  writeJson(path.join(reportsDirectory, "validation.json"), report);
  fs.mkdirSync(reportsDirectory, { recursive: true });
  fs.writeFileSync(path.join(reportsDirectory, "validation.md"), markdownReport(report), "utf8");
}

export async function runValidation(explicitInput?: string): Promise<ValidationReport> {
  const workbooks = loadWorkbooks(explicitInput);
  const rows = normalizeWorkbooks(workbooks);
  const report = createValidationReport(workbooks, rows);
  writeValidationReport(report);
  return report;
}

async function main(): Promise<void> {
  const options = parseCliArgs();
  const report = await runValidation(options.input);
  console.log(
    `Validated ${report.row_count} rows from ${report.workbook_count} workbook(s): ${report.error_count} error(s), ${report.warning_count} warning(s).`,
  );
  console.log("Reports: reports/validation.json and reports/validation.md");
  if (report.error_count > 0) process.exitCode = 1;
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(`Validation failed: ${errorMessage(error)}`);
    process.exitCode = 1;
  });
}
