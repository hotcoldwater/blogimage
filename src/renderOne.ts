import fs from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import type { CoverRow } from "./normalizeData.js";
import { getIconSvg } from "./iconRegistry.js";
import { themeDefinition } from "./themes.js";
import { escapeHtml, forcedLineHtml, PROJECT_ROOT } from "./utils.js";

export interface LayoutMetrics {
  titleOverflow: boolean;
  subtitleOverflow: boolean;
  titleFontSize: number;
  subtitleFontSize: number;
  titleWidth: number;
  titleAvailableWidth: number;
  titleHeight: number;
  titleAvailableHeight: number;
  subtitleWidth: number;
  subtitleAvailableWidth: number;
  subtitleHeight: number;
  subtitleAvailableHeight: number;
}

export class LayoutOverflowError extends Error {
  constructor(
    public readonly row: CoverRow,
    public readonly layout: LayoutMetrics,
  ) {
    const areas = [layout.titleOverflow ? "cover_title" : "", layout.subtitleOverflow ? "subtitle" : ""]
      .filter(Boolean)
      .join(", ");
    super(`Text overflow at minimum font size (${areas}).`);
    this.name = "LayoutOverflowError";
  }
}

let cachedTemplate: string | undefined;
let cachedStyles: string | undefined;

const MAX_TITLE_FONT_SIZE = 184;
const MIN_TITLE_FONT_SIZE = 48;
const MAX_SUBTITLE_FONT_SIZE = 96;
const MIN_SUBTITLE_FONT_SIZE = 32;

function template(): string {
  cachedTemplate ??= fs.readFileSync(path.join(PROJECT_ROOT, "src", "template.html"), "utf8");
  return cachedTemplate;
}

function styles(): string {
  cachedStyles ??= fs.readFileSync(path.join(PROJECT_ROOT, "src", "styles.css"), "utf8");
  return cachedStyles;
}

function replaceToken(source: string, token: string, value: string): string {
  return source.replaceAll(`{{${token}}}`, value);
}

export function buildCoverHtml(row: CoverRow): string {
  const theme = themeDefinition(row.theme);
  const variables = [
    `--upper-background: ${theme.upperBackground}`,
    `--primary: ${theme.primary}`,
    `--lower-background: ${theme.lowerBackground}`,
    `--accent: ${theme.accent}`,
    `--lower-foreground: ${theme.lowerForeground}`,
  ].join("; ");

  const replacements: Record<string, string> = {
    STYLES: styles(),
    THEME_VARS: variables,
    THEME_NAME: theme.name,
    LARGE_CATEGORY: escapeHtml(row.large_category),
    SMALL_CATEGORY: escapeHtml(row.small_category),
    COVER_TITLE: forcedLineHtml(row.cover_title),
    SUBTITLE: forcedLineHtml(row.subtitle),
    ICON_SVG: getIconSvg(row.icon) ?? "",
    TITLE_SIZE: String(MAX_TITLE_FONT_SIZE),
    SUBTITLE_SIZE: String(MAX_SUBTITLE_FONT_SIZE),
  };

  return Object.entries(replacements).reduce(
    (html, [token, value]) => replaceToken(html, token, value),
    template(),
  );
}

export async function renderOne(page: Page, row: CoverRow, outputPath: string): Promise<LayoutMetrics> {
  await page.setContent(buildCoverHtml(row), { waitUntil: "load" });
  await page.evaluate(async () => document.fonts.ready);

  await page.evaluate(
    ({ titleMin, titleMax, subtitleMin, subtitleMax }) => {
      const title = document.querySelector<HTMLElement>(".cover-title");
      const subtitle = document.querySelector<HTMLElement>(".subtitle");
      if (!title || !subtitle) throw new Error("Template text elements were not found.");

      let titleLow = titleMin;
      let titleHigh = titleMax;
      let bestTitle = titleMin;
      while (titleLow <= titleHigh) {
        const candidate = Math.floor((titleLow + titleHigh) / 2);
        title.style.fontSize = `${candidate}px`;
        const fits = title.scrollWidth <= title.clientWidth + 1 && title.scrollHeight <= title.clientHeight + 1;
        if (fits) {
          bestTitle = candidate;
          titleLow = candidate + 1;
        } else {
          titleHigh = candidate - 1;
        }
      }
      title.style.fontSize = `${bestTitle}px`;

      let subtitleLow = subtitleMin;
      let subtitleHigh = subtitleMax;
      let bestSubtitle = subtitleMin;
      while (subtitleLow <= subtitleHigh) {
        const candidate = Math.floor((subtitleLow + subtitleHigh) / 2);
        subtitle.style.fontSize = `${candidate}px`;
        const fits = subtitle.scrollWidth <= subtitle.clientWidth + 1 && subtitle.scrollHeight <= subtitle.clientHeight + 1;
        if (fits) {
          bestSubtitle = candidate;
          subtitleLow = candidate + 1;
        } else {
          subtitleHigh = candidate - 1;
        }
      }
      subtitle.style.fontSize = `${bestSubtitle}px`;
    },
    {
      titleMin: MIN_TITLE_FONT_SIZE,
      titleMax: MAX_TITLE_FONT_SIZE,
      subtitleMin: MIN_SUBTITLE_FONT_SIZE,
      subtitleMax: MAX_SUBTITLE_FONT_SIZE,
    },
  );

  const metrics = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>(".cover-title");
    const subtitle = document.querySelector<HTMLElement>(".subtitle");
    if (!title || !subtitle) throw new Error("Template text elements were not found.");

    return {
      titleOverflow: title.scrollWidth > title.clientWidth + 1 || title.scrollHeight > title.clientHeight + 1,
      subtitleOverflow: subtitle.scrollWidth > subtitle.clientWidth + 1 || subtitle.scrollHeight > subtitle.clientHeight + 1,
      titleFontSize: Number.parseFloat(getComputedStyle(title).fontSize),
      subtitleFontSize: Number.parseFloat(getComputedStyle(subtitle).fontSize),
      titleWidth: title.scrollWidth,
      titleAvailableWidth: title.clientWidth,
      titleHeight: title.scrollHeight,
      titleAvailableHeight: title.clientHeight,
      subtitleWidth: subtitle.scrollWidth,
      subtitleAvailableWidth: subtitle.clientWidth,
      subtitleHeight: subtitle.scrollHeight,
      subtitleAvailableHeight: subtitle.clientHeight,
    };
  });

  if (metrics.titleOverflow || metrics.subtitleOverflow) {
    throw new LayoutOverflowError(row, metrics);
  }

  await page.screenshot({
    path: outputPath,
    type: "png",
    clip: { x: 0, y: 0, width: 1200, height: 1200 },
    animations: "disabled",
  });
  return metrics;
}
