import type { LoadedWorkbook } from "./loadExcel.js";

export const REQUIRED_COLUMNS = [
  "id",
  "post_title",
  "post_url",
  "large_category",
  "small_category",
  "cover_title",
  "subtitle",
  "theme",
  "icon",
  "file_name",
  "generation_status",
  "upload_status",
  "notes",
] as const;

export const RENDER_REQUIRED_COLUMNS = [
  "id",
  "large_category",
  "small_category",
  "cover_title",
  "subtitle",
  "theme",
  "icon",
  "file_name",
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

export interface CoverRow {
  id: string;
  post_title: string;
  post_url: string;
  large_category: string;
  small_category: string;
  cover_title: string;
  subtitle: string;
  theme: string;
  original_theme: string;
  icon: string;
  file_name: string;
  generation_status: string;
  upload_status: string;
  notes: string;
  source_file: string;
  source_sheet: string;
  source_row: number;
}

export function cellText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function normalizeTheme(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "투자" || normalized === "invest") return "investment";
  if (normalized === "제휴" || normalized === "성과형") return "cpa";
  if (normalized === "아이티") return "it";
  if (normalized === "스포츠") return "sports";
  if (normalized === "남수단" || normalized === "southsudan" || normalized === "south_sudan") return "south-sudan";
  if (normalized === "기록") return "record";
  return normalized;
}

export function normalizeWorkbook(workbook: LoadedWorkbook): CoverRow[] {
  return workbook.rows.map((rawRow, index) => {
    const originalTheme = cellText(rawRow.theme);
    return {
      id: cellText(rawRow.id),
      post_title: cellText(rawRow.post_title),
      post_url: cellText(rawRow.post_url),
      large_category: cellText(rawRow.large_category),
      small_category: cellText(rawRow.small_category),
      cover_title: cellText(rawRow.cover_title),
      subtitle: cellText(rawRow.subtitle),
      theme: normalizeTheme(originalTheme),
      original_theme: originalTheme,
      icon: cellText(rawRow.icon).toLowerCase(),
      file_name: cellText(rawRow.file_name),
      generation_status: cellText(rawRow.generation_status),
      upload_status: cellText(rawRow.upload_status),
      notes: cellText(rawRow.notes),
      source_file: workbook.fileName,
      source_sheet: workbook.sheetName,
      source_row: index + 2,
    };
  });
}

export function normalizeWorkbooks(workbooks: LoadedWorkbook[]): CoverRow[] {
  return workbooks.flatMap(normalizeWorkbook);
}
