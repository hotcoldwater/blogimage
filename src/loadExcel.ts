import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { PROJECT_ROOT } from "./utils.js";

export interface LoadedWorkbook {
  filePath: string;
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

function spreadsheetFilesIn(directory: string): string[] {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      return entry.isFile() && (extension === ".xlsx" || extension === ".csv") && !entry.name.startsWith("~$");
    })
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right, "ko"));
}

export function discoverExcelFiles(explicitInput?: string): string[] {
  if (explicitInput) {
    const resolved = path.resolve(PROJECT_ROOT, explicitInput);
    if (!fs.existsSync(resolved)) throw new Error(`Input does not exist: ${resolved}`);
    if (fs.statSync(resolved).isDirectory()) {
      const files = spreadsheetFilesIn(resolved);
      if (files.length === 0) throw new Error(`No .xlsx or .csv files found in: ${resolved}`);
      return files;
    }
    if (![".xlsx", ".csv"].includes(path.extname(resolved).toLowerCase())) {
      throw new Error(`Input must be an .xlsx or .csv file: ${resolved}`);
    }
    return [resolved];
  }

  const inputFiles = spreadsheetFilesIn(path.join(PROJECT_ROOT, "input"));
  if (inputFiles.length > 0) return inputFiles;

  const rootFiles = spreadsheetFilesIn(PROJECT_ROOT);
  if (rootFiles.length === 0) {
    throw new Error("No .xlsx or .csv files found in ./input or the project root.");
  }
  return rootFiles;
}

export function loadWorkbook(filePath: string): LoadedWorkbook {
  const workbook = XLSX.readFile(filePath, { cellDates: false, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`Workbook has no worksheets: ${filePath}`);

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });
  const headers = (matrix[0] ?? []).map((value) => String(value).trim()).filter(Boolean);
  const rows = XLSX.utils
    .sheet_to_json<Record<string, unknown>>(sheet, { defval: "", blankrows: false, raw: false })
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ""));

  return {
    filePath,
    fileName: path.basename(filePath),
    sheetName,
    headers,
    rows,
  };
}

export function loadWorkbooks(explicitInput?: string): LoadedWorkbook[] {
  return discoverExcelFiles(explicitInput).map(loadWorkbook);
}
