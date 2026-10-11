import {
  allowedSmallCategories,
  categoryIcon,
  isSupportedLargeCategory,
} from "./categoryMappings.js";
import type { SupportedIcon } from "./iconRegistry.js";
import { sanitizePostTitle } from "./seriesPaths.js";
import {
  isSeriesTheme,
  SERIES_THEME_NAMES,
  seriesThemeIconNames,
  seriesThemeLargeCategories,
  seriesThemeSmallCategories,
  type SeriesThemeName,
} from "./themes.js";

export const SERIES_ROLES = [
  "cover",
  "summary",
  "key_point",
  "comparison",
  "process",
  "cause_effect",
  "pros_cons",
  "impact",
  "risk",
  "numbers",
  "checklist",
  "conclusion",
] as const;

export const SERIES_LAYOUTS = [
  "cover",
  "bullet_3",
  "compare_2col",
  "process_4",
  "cause_effect",
  "numbers",
  "conclusion",
] as const;

export type SeriesRole = (typeof SERIES_ROLES)[number];
export type SeriesLayout = (typeof SERIES_LAYOUTS)[number];

export interface SeriesSide {
  label: string;
  items: string[];
}

export interface SeriesNumber {
  value: string;
  label: string;
}

export interface SeriesCard {
  card_no: number;
  role: SeriesRole;
  layout: SeriesLayout;
  image_name: string;
  insert_token: string;
  title: string[];
  icon?: SupportedIcon;
  subtitle?: string[];
  items?: string[];
  left?: SeriesSide;
  right?: SeriesSide;
  steps?: string[];
  causes?: string[];
  effects?: string[];
  numbers?: SeriesNumber[];
  body?: string[];
}

export interface SeriesRenderInput {
  schema_version: "2.0" | "2.1";
  task: "render_series";
  theme?: SeriesThemeName;
  post_title: string;
  large_category: string;
  small_category: string;
  canvas: { width: 1080; height: 1080 };
  cards: SeriesCard[];
}

export interface SeriesInputIssue {
  field: string;
  value: unknown;
  correction: string;
}

export class SeriesInputValidationError extends Error {
  constructor(public readonly issues: SeriesInputIssue[]) {
    super("Invalid series JSON input.");
    this.name = "SeriesInputValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(field: string, value: unknown, issues: SeriesInputIssue[]): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    issues.push({ field, value, correction: "비어 있지 않은 문자열이어야 합니다." });
    return undefined;
  }
  if (value !== value.trim()) {
    issues.push({ field, value, correction: "앞뒤 공백을 제거하세요." });
    return undefined;
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    issues.push({ field, value, correction: "제어문자를 제거하세요." });
    return undefined;
  }
  return value;
}

function textLength(value: string): number {
  return Array.from(value).length;
}

function lineArray(
  field: string,
  value: unknown,
  min: number,
  max: number,
  maxLength: number,
  issues: SeriesInputIssue[],
): string[] | undefined {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    issues.push({ field, value, correction: `비어 있지 않은 문자열 ${min}${min === max ? "" : `~${max}`}개로 이루어진 배열이어야 합니다.` });
    return undefined;
  }
  const result: string[] = [];
  for (const [index, item] of value.entries()) {
    const itemField = `${field}[${index}]`;
    const text = stringValue(itemField, item, issues);
    if (!text) continue;
    if (/[|\r\n]/.test(text)) {
      issues.push({ field: itemField, value: item, correction: "줄바꿈 문자와 |를 제거하고 줄별 배열 항목으로 나누세요." });
      continue;
    }
    const length = textLength(text);
    if (length > maxLength) {
      issues.push({
        field: itemField,
        value: item,
        correction: `현재 ${length}자입니다. ${maxLength}자 이하로 줄이세요. 내용은 렌더러가 임의로 자르지 않습니다.`,
      });
      continue;
    }
    result.push(text);
  }
  return result.length === value.length ? result : undefined;
}

function validateLegacyCategory(value: Record<string, unknown>, issues: SeriesInputIssue[]): { large?: string; small?: string } {
  const large = stringValue("large_category", value.large_category, issues);
  if (large === "머무름") {
    issues.push({
      field: "large_category",
      value: large,
      correction: "머무름 카테고리는 실제 사진을 사용하므로 텍스트형 이미지 생성 대상이 아닙니다.",
    });
  } else if (large && !isSupportedLargeCategory(large)) {
    issues.push({ field: "large_category", value: large, correction: "투자, CPA, IT, 스포츠, 남수단, 기록 중 하나여야 합니다." });
  }
  const small = stringValue("small_category", value.small_category, issues);
  if (large && small && isSupportedLargeCategory(large) && !categoryIcon(large, small)) {
    issues.push({ field: "small_category", value: small, correction: `${large}의 허용값: ${allowedSmallCategories(large).join(", ")}` });
  }
  return { large, small };
}

function validateSeriesThemeCategory(
  value: Record<string, unknown>,
  theme: SeriesThemeName,
  issues: SeriesInputIssue[],
): { large?: string; small?: string } {
  const large = stringValue("large_category", value.large_category, issues);
  const allowedLarge = seriesThemeLargeCategories(theme);
  if (large && !allowedLarge.includes(large)) {
    issues.push({ field: "large_category", value: large, correction: `${theme}의 허용값: ${allowedLarge.join(", ")}` });
  }
  const small = stringValue("small_category", value.small_category, issues);
  if (large && small && allowedLarge.includes(large)) {
    const allowedSmall = seriesThemeSmallCategories(theme, large);
    if (!allowedSmall.includes(small)) {
      issues.push({ field: "small_category", value: small, correction: `${theme} ${large}의 허용값: ${allowedSmall.join(", ")}` });
    }
  }
  return { large, small };
}

function validateImageName(field: string, value: unknown, issues: SeriesInputIssue[]): string | undefined {
  const name = stringValue(field, value, issues);
  if (!name) return undefined;
  if (!name.endsWith(".png")) {
    issues.push({ field, value, correction: "파일명은 소문자 .png 확장자로 끝나야 합니다." });
  }
  if (name.includes("..") || /[\\/]/.test(name) || /^(?:[A-Za-z]:|[\\/])/.test(name)) {
    issues.push({ field, value, correction: "경로, 절대경로, 경로 구분자, .. 없이 PNG 파일명만 입력하세요." });
  }
  if (/[<>:"|?*]/.test(name)) {
    issues.push({ field, value, correction: "Windows 파일명 금지문자 < > : \" | ? * 를 제거하세요." });
  }
  return name;
}

function validateSide(field: string, value: unknown, issues: SeriesInputIssue[]): SeriesSide | undefined {
  if (!isRecord(value)) {
    issues.push({ field, value, correction: "label과 items를 가진 객체여야 합니다." });
    return undefined;
  }
  const label = stringValue(`${field}.label`, value.label, issues);
  if (label && textLength(label) > 16) {
    issues.push({ field: `${field}.label`, value: label, correction: `현재 ${textLength(label)}자입니다. 16자 이하로 줄이세요.` });
  }
  const items = lineArray(`${field}.items`, value.items, 2, 3, 26, issues);
  return label && textLength(label) <= 16 && items ? { label, items } : undefined;
}

function validateNumbers(field: string, value: unknown, issues: SeriesInputIssue[]): SeriesNumber[] | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    issues.push({ field, value, correction: "value와 label을 가진 객체 1~3개로 이루어진 배열이어야 합니다." });
    return undefined;
  }
  const result: SeriesNumber[] = [];
  for (const [index, item] of value.entries()) {
    const itemField = `${field}[${index}]`;
    if (!isRecord(item)) {
      issues.push({ field: itemField, value: item, correction: '{"value":"40%","label":"설명"} 형식의 객체여야 합니다.' });
      continue;
    }
    const numericValue = stringValue(`${itemField}.value`, item.value, issues);
    const label = stringValue(`${itemField}.label`, item.label, issues);
    if (numericValue && textLength(numericValue) > 14) {
      issues.push({ field: `${itemField}.value`, value: numericValue, correction: `현재 ${textLength(numericValue)}자입니다. 14자 이하로 줄이세요.` });
    }
    if (label && textLength(label) > 24) {
      issues.push({ field: `${itemField}.label`, value: label, correction: `현재 ${textLength(label)}자입니다. 24자 이하로 줄이세요.` });
    }
    if (numericValue && label && textLength(numericValue) <= 14 && textLength(label) <= 24) result.push({ value: numericValue, label });
  }
  return result.length === value.length ? result : undefined;
}

function validateCard(
  value: unknown,
  index: number,
  schemaVersion: "2.0" | "2.1" | undefined,
  theme: SeriesThemeName | undefined,
  issues: SeriesInputIssue[],
): SeriesCard | undefined {
  const prefix = `cards[${index}]`;
  if (!isRecord(value)) {
    issues.push({ field: prefix, value, correction: "카드가 JSON 객체여야 합니다." });
    return undefined;
  }

  const cardNo = value.card_no;
  if (!Number.isInteger(cardNo) || (cardNo as number) < 1) {
    issues.push({ field: `${prefix}.card_no`, value: cardNo, correction: `${index + 1}를 입력하세요. card_no는 1부터 연속된 정수여야 합니다.` });
  } else if (cardNo !== index + 1) {
    issues.push({ field: `${prefix}.card_no`, value: cardNo, correction: `배열 순서에 맞는 연속 번호 ${index + 1}을 입력하세요.` });
  }

  const roleText = stringValue(`${prefix}.role`, value.role, issues);
  const role = roleText && SERIES_ROLES.includes(roleText as SeriesRole) ? roleText as SeriesRole : undefined;
  if (roleText && !role) {
    issues.push({ field: `${prefix}.role`, value: roleText, correction: `허용값: ${SERIES_ROLES.join(", ")}` });
  }

  const layoutText = stringValue(`${prefix}.layout`, value.layout, issues);
  const layout = layoutText && SERIES_LAYOUTS.includes(layoutText as SeriesLayout) ? layoutText as SeriesLayout : undefined;
  if (layoutText && !layout) {
    issues.push({ field: `${prefix}.layout`, value: layoutText, correction: `허용값: ${SERIES_LAYOUTS.join(", ")}` });
  }

  const imageName = validateImageName(`${prefix}.image_name`, value.image_name, issues);
  const insertToken = stringValue(`${prefix}.insert_token`, value.insert_token, issues);
  if (Number.isInteger(cardNo) && role && imageName && insertToken) {
    const expected = `[[IMAGE_${String(cardNo).padStart(2, "0")}:${role.toUpperCase()}:${imageName}]]`;
    if (insertToken !== expected) {
      issues.push({ field: `${prefix}.insert_token`, value: insertToken, correction: `카드 정보와 일치하도록 ${expected}로 수정하세요.` });
    }
  }

  const title = lineArray(`${prefix}.title`, value.title, 1, 2, 22, issues);
  const card: Partial<SeriesCard> = { card_no: cardNo as number, role, layout, image_name: imageName, insert_token: insertToken, title };

  if (schemaVersion === "2.1" && theme && value.icon !== undefined) {
    const iconText = stringValue(`${prefix}.icon`, value.icon, issues);
    if (iconText && seriesThemeIconNames(theme).includes(iconText as SupportedIcon)) {
      card.icon = iconText as SupportedIcon;
    } else if (iconText) {
      issues.push({ field: `${prefix}.icon`, value: iconText, correction: `허용된 ${theme} icon token을 입력하세요. README의 icon whitelist를 확인하세요.` });
    }
  }

  if (layout === "cover") {
    card.subtitle = lineArray(`${prefix}.subtitle`, value.subtitle, 1, 2, 26, issues);
  } else if (layout === "bullet_3") {
    card.items = lineArray(`${prefix}.items`, value.items, 3, 3, 32, issues);
  } else if (layout === "compare_2col") {
    card.left = validateSide(`${prefix}.left`, value.left, issues);
    card.right = validateSide(`${prefix}.right`, value.right, issues);
  } else if (layout === "process_4") {
    card.steps = lineArray(`${prefix}.steps`, value.steps, 3, 4, 28, issues);
  } else if (layout === "cause_effect") {
    card.causes = lineArray(`${prefix}.causes`, value.causes, 2, 3, 28, issues);
    card.effects = lineArray(`${prefix}.effects`, value.effects, 2, 3, 28, issues);
  } else if (layout === "numbers") {
    card.numbers = validateNumbers(`${prefix}.numbers`, value.numbers, issues);
  } else if (layout === "conclusion") {
    const hasBody = value.body !== undefined;
    const hasItems = value.items !== undefined;
    if (hasBody === hasItems) {
      issues.push({ field: prefix, value: { body: value.body, items: value.items }, correction: "conclusion에는 body 1~2개 또는 items 3개 중 정확히 하나만 입력하세요." });
    } else if (hasBody) {
      card.body = lineArray(`${prefix}.body`, value.body, 1, 2, 34, issues);
    } else {
      card.items = lineArray(`${prefix}.items`, value.items, 3, 3, 30, issues);
    }
  }

  return cardNo === index + 1 && role && layout && imageName && insertToken && title
    ? card as SeriesCard
    : undefined;
}

export function parseSeriesRenderInput(value: unknown): SeriesRenderInput {
  if (!isRecord(value)) {
    throw new SeriesInputValidationError([{ field: "$", value, correction: "입력 전체가 JSON 객체여야 합니다." }]);
  }

  const issues: SeriesInputIssue[] = [];
  const schemaVersion = value.schema_version === "2.0" || value.schema_version === "2.1"
    ? value.schema_version
    : undefined;
  if (!schemaVersion) issues.push({ field: "schema_version", value: value.schema_version, correction: '"2.0" 또는 "2.1"을 입력하세요.' });
  if (value.task !== "render_series") issues.push({ field: "task", value: value.task, correction: '"render_series"를 입력하세요.' });
  const postTitle = stringValue("post_title", value.post_title, issues);
  if (postTitle && !sanitizePostTitle(postTitle)) {
    issues.push({
      field: "post_title",
      value: postTitle,
      correction: "파일시스템 금지문자를 제거한 뒤에도 남는 문자·숫자·한글이 포함된 제목으로 수정하세요.",
    });
  }
  let theme: SeriesThemeName | undefined;
  if (schemaVersion === "2.1") {
    const themeText = stringValue("theme", value.theme, issues);
    if (themeText && isSeriesTheme(themeText)) {
      theme = themeText;
    } else if (themeText) {
      issues.push({ field: "theme", value: themeText, correction: `허용값: ${SERIES_THEME_NAMES.join(", ")}` });
    }
  }
  const { large, small } = schemaVersion === "2.1" && theme
    ? validateSeriesThemeCategory(value, theme, issues)
    : schemaVersion === "2.1"
      ? {
          large: stringValue("large_category", value.large_category, issues),
          small: stringValue("small_category", value.small_category, issues),
        }
      : validateLegacyCategory(value, issues);

  if (!isRecord(value.canvas)) {
    issues.push({ field: "canvas", value: value.canvas, correction: '{"width":1080,"height":1080}을 입력하세요.' });
  } else {
    if (value.canvas.width !== 1080) issues.push({ field: "canvas.width", value: value.canvas.width, correction: "1080을 입력하세요." });
    if (value.canvas.height !== 1080) issues.push({ field: "canvas.height", value: value.canvas.height, correction: "1080을 입력하세요." });
  }

  const cards: SeriesCard[] = [];
  if (!Array.isArray(value.cards) || value.cards.length < 3 || value.cards.length > 5) {
    issues.push({ field: "cards", value: value.cards, correction: "카드 3~5개로 이루어진 배열이어야 합니다." });
  } else {
    for (const [index, rawCard] of value.cards.entries()) {
      const card = validateCard(rawCard, index, schemaVersion, theme, issues);
      if (card) cards.push(card);
    }
    const first = value.cards[0];
    const second = value.cards[1];
    const last = value.cards[value.cards.length - 1];
    if (isRecord(first) && first.role !== "cover") issues.push({ field: "cards[0].role", value: first.role, correction: '첫 카드 역할은 "cover"여야 합니다.' });
    if (isRecord(second) && second.role !== "summary") issues.push({ field: "cards[1].role", value: second.role, correction: '둘째 카드 역할은 "summary"여야 합니다.' });
    if (isRecord(last) && last.role !== "conclusion") issues.push({ field: `cards[${value.cards.length - 1}].role`, value: last.role, correction: '마지막 카드 역할은 "conclusion"이어야 합니다.' });

    const names = new Map<string, number>();
    for (const [index, rawCard] of value.cards.entries()) {
      if (!isRecord(rawCard) || typeof rawCard.image_name !== "string") continue;
      const previous = names.get(rawCard.image_name);
      if (previous !== undefined) {
        issues.push({ field: `cards[${index}].image_name`, value: rawCard.image_name, correction: `cards[${previous}].image_name과 중복되지 않는 파일명을 입력하세요.` });
      } else names.set(rawCard.image_name, index);
    }
  }

  if (issues.length > 0) throw new SeriesInputValidationError(issues);
  return {
    schema_version: schemaVersion!,
    task: "render_series",
    ...(theme ? { theme } : {}),
    post_title: postTitle!,
    large_category: large!,
    small_category: small!,
    canvas: { width: 1080, height: 1080 },
    cards,
  };
}

export function formatSeriesInputError(error: SeriesInputValidationError): string {
  const valueText = (value: unknown): string => {
    if (value === undefined) return "(없음)";
    const serialized = JSON.stringify(value);
    return serialized.length > 220 ? `${serialized.slice(0, 217)}...` : serialized;
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
