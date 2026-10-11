import fs from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import { categoryIcon, categoryTheme, isSupportedLargeCategory } from "./categoryMappings.js";
import { getIconSvg } from "./iconRegistry.js";
import type { SeriesCard, SeriesRenderInput } from "./seriesInputSchema.js";
import {
  seriesThemeCategoryIcon,
  seriesThemeCategoryPalette,
  seriesThemeDefinition,
  themeDefinition,
} from "./themes.js";
import { escapeHtml, forcedLineHtml, PROJECT_ROOT } from "./utils.js";

export interface SeriesTextMetric {
  field: string;
  fontSize: number;
  width: number;
  availableWidth: number;
  height: number;
  availableHeight: number;
  overflow: boolean;
}

export interface SeriesCardLayoutMetrics {
  text: SeriesTextMetric[];
}

export class SeriesLayoutOverflowError extends Error {
  constructor(
    public readonly card: SeriesCard,
    public readonly metrics: SeriesCardLayoutMetrics,
  ) {
    const fields = metrics.text.filter((entry) => entry.overflow).map((entry) => entry.field).join(", ");
    super(`카드 ${card.card_no} (${card.layout})의 텍스트가 최소 글자 크기에서도 허용 영역을 넘습니다: ${fields}`);
    this.name = "SeriesLayoutOverflowError";
  }
}

let cachedStyles: string | undefined;

function styles(): string {
  cachedStyles ??= fs.readFileSync(path.join(PROJECT_ROOT, "src", "seriesStyles.css"), "utf8");
  return cachedStyles;
}

function fitText(
  tag: string,
  className: string,
  field: string,
  contents: string,
  minSize: number,
  maxSize: number,
): string {
  return `<${tag} class="${className} fit-text" data-fit data-field="${field}" data-min-size="${minSize}" data-max-size="${maxSize}">${contents}</${tag}>`;
}

function listMarkup(card: SeriesCard, values: string[], className: string, field: string, min = 24, max = 48): string {
  return values.map((value, index) => fitText("li", className, `${field}[${index}]`, escapeHtml(value), min, max)).join("");
}

function legacyCoverMarkup(input: SeriesRenderInput, card: SeriesCard): string {
  const icon = isSupportedLargeCategory(input.large_category)
    ? categoryIcon(input.large_category, input.small_category)
    : undefined;
  return `
    ${fitText("h1", "card-title cover-title", "title", forcedLineHtml(card.title.join("|")), 48, 160)}
    <section class="cover-lower">
      <div class="cover-row">
        <div class="icon-wrap" aria-hidden="true">${icon ? getIconSvg(icon) ?? "" : ""}</div>
        <div class="vertical-divider" aria-hidden="true"></div>
        ${fitText("div", "cover-subtitle", "subtitle", forcedLineHtml(card.subtitle!.join("|")), 32, 82)}
      </div>
      <div class="cover-brand">자각 : 기록의 온도</div>
    </section>`;
}

export function resolveSeriesThemeCardIcon(input: SeriesRenderInput, card: SeriesCard): string | undefined {
  if (input.schema_version !== "2.1" || !input.theme) return undefined;
  const theme = seriesThemeDefinition(input.theme);
  if (card.icon) return card.icon;
  if (card.role === "cover") return seriesThemeCategoryIcon(input.theme, input.large_category, input.small_category);
  return theme.roleIcons[card.role];
}

export function resolveInsuranceCardIcon(input: SeriesRenderInput, card: SeriesCard): string | undefined {
  return resolveSeriesThemeCardIcon(input, card);
}

function iconMarkup(icon: string | undefined, className: string): string {
  return `<div class="${className}"${icon ? ` data-icon="${escapeHtml(icon)}"` : ""} aria-hidden="true">${icon ? getIconSvg(icon) ?? "" : ""}</div>`;
}

function insuranceCoverMarkup(input: SeriesRenderInput, card: SeriesCard): string {
  if (!input.theme) throw new Error("Missing series theme after validation.");
  const theme = seriesThemeDefinition(input.theme);
  return `<section class="insurance-cover-content">
    ${iconMarkup(resolveSeriesThemeCardIcon(input, card), "insurance-cover-icon")}
    ${fitText("h1", "card-title insurance-cover-title", "title", forcedLineHtml(card.title.join("|")), 48, 132)}
    ${fitText("div", "insurance-cover-subtitle", "subtitle", forcedLineHtml(card.subtitle!.join("|")), 32, 62)}
    <div class="insurance-cover-brand">${escapeHtml(theme.brandName)}</div>
  </section>`;
}

function jagakCoverMarkup(input: SeriesRenderInput, card: SeriesCard): string {
  if (!input.theme) throw new Error("Missing series theme after validation.");
  const theme = seriesThemeDefinition(input.theme);
  return `${fitText("h1", "card-title cover-title jagak-cover-title", "title", forcedLineHtml(card.title.join("|")), 48, 160)}
    <section class="cover-lower jagak-cover-lower">
      <div class="cover-row">
        ${iconMarkup(resolveSeriesThemeCardIcon(input, card), "icon-wrap jagak-cover-icon")}
        <div class="vertical-divider" aria-hidden="true"></div>
        ${fitText("div", "cover-subtitle", "subtitle", forcedLineHtml(card.subtitle!.join("|")), 32, 82)}
      </div>
      <div class="cover-brand">${escapeHtml(theme.brandName)}</div>
    </section>`;
}

function bulletMarkup(card: SeriesCard): string {
  return `<ol class="bullet-list">${card.items!.map((item, index) => `
    <li class="bullet-item">
      <span class="bullet-index">${String(index + 1).padStart(2, "0")}</span>
      ${fitText("span", "bullet-text", `items[${index}]`, escapeHtml(item), 28, 48)}
    </li>`).join("")}</ol>`;
}

function compareMarkup(card: SeriesCard): string {
  const side = (name: "left" | "right") => {
    const value = card[name]!;
    return `<section class="compare-side ${name}">
      ${fitText("div", "compare-label", `${name}.label`, escapeHtml(value.label), 28, 48)}
      <ul class="compare-items">${listMarkup(card, value.items, "compare-item", `${name}.items`, 24, 38)}</ul>
    </section>`;
  };
  return `<div class="compare-grid">${side("left")} ${side("right")}</div>`;
}

function processMarkup(card: SeriesCard): string {
  return `<ol class="process-list">${card.steps!.map((step, index) => `
    <li class="process-step">
      <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
      ${fitText("span", "step-text", `steps[${index}]`, escapeHtml(step), 26, 46)}
    </li>`).join("")}</ol>`;
}

function causeEffectMarkup(card: SeriesCard): string {
  return `<div class="cause-effect-grid">
    <section class="cause-effect-column causes">${listMarkup(card, card.causes!, "cause-effect-item", "causes", 23, 38)}</section>
    <div class="direction-arrow" aria-hidden="true">→</div>
    <section class="cause-effect-column effects">${listMarkup(card, card.effects!, "cause-effect-item", "effects", 23, 38)}</section>
  </div>`;
}

function numbersMarkup(card: SeriesCard): string {
  const values = card.numbers!;
  return `<div class="numbers-grid count-${values.length}">${values.map((entry, index) => `
    <section class="number-block">
      ${fitText("div", "number-value", `numbers[${index}].value`, escapeHtml(entry.value), 38, 94)}
      ${fitText("div", "number-label", `numbers[${index}].label`, escapeHtml(entry.label), 24, 38)}
    </section>`).join("")}</div>`;
}

function conclusionMarkup(card: SeriesCard): string {
  if (card.body) {
    return `<section class="conclusion-panel"><div class="conclusion-body">${card.body.map((line, index) =>
      fitText("div", "conclusion-line", `body[${index}]`, escapeHtml(line), 28, 50)).join("")}</div></section>`;
  }
  return `<section class="conclusion-panel"><ul class="conclusion-items">${listMarkup(card, card.items!, "conclusion-item", "items", 25, 42)}</ul></section>`;
}

function bodyMarkup(card: SeriesCard): string {
  if (card.layout === "bullet_3") return bulletMarkup(card);
  if (card.layout === "compare_2col") return compareMarkup(card);
  if (card.layout === "process_4") return processMarkup(card);
  if (card.layout === "cause_effect") return causeEffectMarkup(card);
  if (card.layout === "numbers") return numbersMarkup(card);
  if (card.layout === "conclusion") return conclusionMarkup(card);
  throw new Error(`Unsupported layout after validation: ${card.layout}`);
}

export function buildSeriesCardHtml(input: SeriesRenderInput, card: SeriesCard): string {
  const seriesThemeName = input.schema_version === "2.1" ? input.theme : undefined;
  let variables: string;
  let header: string;
  let content: string;
  if (seriesThemeName) {
    const theme = seriesThemeDefinition(seriesThemeName);
    const palette = seriesThemeCategoryPalette(seriesThemeName, input.large_category);
    if (!palette) throw new Error(`Unsupported ${seriesThemeName} category after validation: ${input.large_category}`);
    variables = [
      `--upper-background: ${theme.background}`,
      `--surface: ${theme.surface}`,
      `--primary: ${palette.primary}`,
      `--secondary: ${palette.secondary}`,
      `--soft: ${palette.soft}`,
      `--text: ${theme.text}`,
      `--muted: ${theme.muted}`,
      `--border: ${theme.border}`,
      `--conclusion-text: ${theme.conclusionText}`,
      `--lower-background: ${palette.primary}`,
      `--accent: ${palette.secondary}`,
      `--lower-foreground: ${theme.conclusionText}`,
    ].join("; ");
    const categoryIconName = seriesThemeCategoryIcon(seriesThemeName, input.large_category, input.small_category);
    header = `<header class="category-header insurance-category-header">
      <div class="category-badge insurance-category-badge" style="color: ${palette.primary}">
        ${iconMarkup(categoryIconName, "insurance-badge-icon")}
        <span>${escapeHtml(input.small_category)}</span>
      </div>
      <div class="insurance-category-line" aria-hidden="true"></div>
    </header>`;
    if (card.layout === "cover") {
      content = seriesThemeName === "jagak" ? jagakCoverMarkup(input, card) : insuranceCoverMarkup(input, card);
    } else {
      content = `<section class="card-content layout-${card.layout}">
          <div class="insurance-heading">
            ${iconMarkup(resolveSeriesThemeCardIcon(input, card), "insurance-card-icon")}
            ${fitText("h1", "card-title", "title", forcedLineHtml(card.title.join("|")), 42, 82)}
          </div>
          ${bodyMarkup(card)}
        </section>
        ${card.layout === "conclusion" ? `<footer class="insurance-conclusion-brand">${escapeHtml(theme.brandName)}</footer>` : ""}`;
    }
  } else {
    if (!isSupportedLargeCategory(input.large_category)) throw new Error(`Unsupported category after validation: ${input.large_category}`);
    const theme = themeDefinition(categoryTheme(input.large_category));
    variables = [
      `--upper-background: ${theme.upperBackground}`,
      `--primary: ${theme.primary}`,
      `--lower-background: ${theme.lowerBackground}`,
      `--accent: ${theme.accent}`,
      `--lower-foreground: ${theme.lowerForeground}`,
    ].join("; ");
    header = `<header class="category-header">
      <div class="category-badge">${escapeHtml(input.large_category)}</div>
      <div class="category-line" aria-hidden="true"><span></span></div>
      <div class="small-category">${escapeHtml(input.small_category)}</div>
    </header>`;
    content = card.layout === "cover"
      ? legacyCoverMarkup(input, card)
      : `<section class="card-content layout-${card.layout}">
          ${fitText("h1", "card-title", "title", forcedLineHtml(card.title.join("|")), 42, 96)}
          ${bodyMarkup(card)}
        </section>
        <footer class="brand-footer">자각 : 기록의 온도</footer>`;
  }

  return `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, initial-scale=1"><style>${styles()}</style></head>
  <body><main class="series-card ${card.layout === "cover" ? "cover-card" : ""} ${seriesThemeName ? "insurance-card" : ""} ${seriesThemeName === "jagak" ? "jagak-card" : ""} ${seriesThemeName === "yeobaek" ? "yeobaek-card" : ""} ${card.layout === "conclusion" ? "conclusion-card" : ""}" style="${variables}" data-layout="${card.layout}" data-theme="${seriesThemeName ?? "legacy"}">${header}${content}</main></body></html>`;
}

export async function renderSeriesCard(
  page: Page,
  input: SeriesRenderInput,
  card: SeriesCard,
  outputPath: string,
): Promise<SeriesCardLayoutMetrics> {
  await page.setContent(buildSeriesCardHtml(input, card), { waitUntil: "load" });
  await page.evaluate(async () => document.fonts.ready);

  await page.evaluate(() => {
    for (const element of Array.from(document.querySelectorAll<HTMLElement>("[data-fit]"))) {
      let low = Number(element.dataset.minSize);
      let high = Number(element.dataset.maxSize);
      let best = low;
      while (low <= high) {
        const candidate = Math.floor((low + high) / 2);
        element.style.fontSize = `${candidate}px`;
        const fits = element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1;
        if (fits) {
          best = candidate;
          low = candidate + 1;
        } else {
          high = candidate - 1;
        }
      }
      element.style.fontSize = `${best}px`;
    }
  });

  const metrics: SeriesCardLayoutMetrics = {
    text: await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("[data-fit]")).map((element) => ({
      field: element.dataset.field ?? "unknown",
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      width: element.scrollWidth,
      availableWidth: element.clientWidth,
      height: element.scrollHeight,
      availableHeight: element.clientHeight,
      overflow: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
    }))),
  };

  if (metrics.text.some((entry) => entry.overflow)) throw new SeriesLayoutOverflowError(card, metrics);
  await page.locator(".series-card").screenshot({
    path: outputPath,
    type: "png",
    animations: "disabled",
  });
  return metrics;
}
