import {
  allowedSmallCategories,
  categoryIcon,
  categoryTheme,
  isSupportedLargeCategory,
} from "./categoryMappings.js";
import type { CoverRow } from "./normalizeData.js";
import { coverTitleFileName } from "./utils.js";

export interface SingleRenderInput {
  schema_version: "1.0";
  task: "render_single";
  post_title: string;
  large_category: string;
  small_category: string;
  cover_title: string[];
  subtitle: string[];
}

export interface SingleInputIssue {
  field: string;
  value: unknown;
  correction: string;
}

export class SingleInputValidationError extends Error {
  constructor(public readonly issues: SingleInputIssue[]) {
    super("Invalid single-image JSON input.");
    this.name = "SingleInputValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function validateLines(field: "cover_title" | "subtitle", value: unknown, issues: SingleInputIssue[]): string[] | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) {
    issues.push({ field, value, correction: "비어 있지 않은 문자열 1~2개로 이루어진 배열이어야 합니다." });
    return undefined;
  }

  const lines: string[] = [];
  for (const [index, item] of value.entries()) {
    const line = trimmedString(item);
    if (!line) {
      issues.push({ field: `${field}[${index}]`, value: item, correction: "비어 있지 않은 문자열이어야 합니다." });
      continue;
    }
    if (/[|\r\n]/.test(line)) {
      issues.push({
        field: `${field}[${index}]`,
        value: item,
        correction: "배열 항목 하나가 정확히 한 줄이어야 하므로 줄바꿈 문자와 |를 제거하고 줄별 항목으로 나누세요.",
      });
      continue;
    }
    lines.push(line);
  }
  return lines.length === value.length ? lines : undefined;
}

export function parseSingleRenderInput(value: unknown): SingleRenderInput {
  if (!isRecord(value)) {
    throw new SingleInputValidationError([
      { field: "$", value, correction: "입력 전체가 JSON 객체여야 합니다." },
    ]);
  }

  const issues: SingleInputIssue[] = [];
  if (value.schema_version !== "1.0") {
    issues.push({ field: "schema_version", value: value.schema_version, correction: '"1.0"만 허용됩니다.' });
  }
  if (value.task !== "render_single") {
    issues.push({ field: "task", value: value.task, correction: '"render_single"만 허용됩니다.' });
  }

  const postTitle = trimmedString(value.post_title);
  if (!postTitle) {
    issues.push({ field: "post_title", value: value.post_title, correction: "비어 있지 않은 문자열이어야 합니다." });
  }
  const largeCategory = trimmedString(value.large_category);
  if (!largeCategory) {
    issues.push({ field: "large_category", value: value.large_category, correction: "비어 있지 않은 문자열이어야 합니다." });
  } else if (largeCategory === "머무름") {
    issues.push({
      field: "large_category",
      value: largeCategory,
      correction: "머무름 카테고리는 실제 사진을 대표이미지로 사용하므로 텍스트형 이미지 생성 대상이 아닙니다.",
    });
  } else if (!isSupportedLargeCategory(largeCategory)) {
    issues.push({
      field: "large_category",
      value: largeCategory,
      correction: "투자, CPA, IT, 스포츠, 남수단, 기록 중 하나여야 합니다.",
    });
  }

  const smallCategory = trimmedString(value.small_category);
  if (!smallCategory) {
    issues.push({ field: "small_category", value: value.small_category, correction: "비어 있지 않은 문자열이어야 합니다." });
  } else if (largeCategory && isSupportedLargeCategory(largeCategory) && !categoryIcon(largeCategory, smallCategory)) {
    issues.push({
      field: "small_category",
      value: smallCategory,
      correction: `${largeCategory}의 허용값: ${allowedSmallCategories(largeCategory).join(", ")}`,
    });
  }

  const coverTitle = validateLines("cover_title", value.cover_title, issues);
  const subtitle = validateLines("subtitle", value.subtitle, issues);

  if (issues.length > 0) throw new SingleInputValidationError(issues);

  return {
    schema_version: "1.0",
    task: "render_single",
    post_title: postTitle!,
    large_category: largeCategory!,
    small_category: smallCategory!,
    cover_title: coverTitle!,
    subtitle: subtitle!,
  };
}

export function singleInputToCoverRow(input: SingleRenderInput, sourceName: string): CoverRow {
  const largeCategory = input.large_category;
  if (!isSupportedLargeCategory(largeCategory)) {
    throw new Error(`Unsupported category after validation: ${largeCategory}`);
  }
  const icon = categoryIcon(largeCategory, input.small_category);
  if (!icon) throw new Error(`Unsupported category combination after validation: ${largeCategory}/${input.small_category}`);

  const coverTitle = input.cover_title.join("|");
  return {
    id: "single",
    post_title: input.post_title,
    post_url: "",
    large_category: largeCategory,
    small_category: input.small_category,
    cover_title: coverTitle,
    subtitle: input.subtitle.join("|"),
    theme: categoryTheme(largeCategory),
    original_theme: categoryTheme(largeCategory),
    icon,
    file_name: coverTitleFileName(coverTitle),
    generation_status: "",
    upload_status: "",
    notes: "",
    source_file: sourceName,
    source_sheet: "",
    source_row: 1,
  };
}

export function formatSingleInputError(error: SingleInputValidationError): string {
  const valueText = (value: unknown): string => {
    if (value === undefined) return "(없음)";
    const serialized = JSON.stringify(value);
    return serialized.length > 200 ? `${serialized.slice(0, 197)}...` : serialized;
  };
  return [
    "입력 오류:",
    ...error.issues.flatMap((issue) => [
      `- 잘못된 필드: ${issue.field}`,
      `  현재 입력값: ${valueText(issue.value)}`,
      `  수정 방법: ${issue.correction}`,
    ]),
  ].join("\n");
}
