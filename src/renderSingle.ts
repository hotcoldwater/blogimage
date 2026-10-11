import fs from "node:fs";
import path from "node:path";
import { launchRendererBrowser } from "./browser.js";
import { renderOne, LayoutOverflowError, type LayoutMetrics } from "./renderOne.js";
import {
  formatSingleInputError,
  parseSingleRenderInput,
  singleInputToCoverRow,
  SingleInputValidationError,
} from "./singleInputSchema.js";
import { renderSeriesJson } from "./renderSeries.js";
import { SeriesLayoutOverflowError } from "./renderSeriesCard.js";
import { formatSeriesInputError, SeriesInputValidationError } from "./seriesInputSchema.js";
import {
  ensureDirectory,
  errorMessage,
  isDirectExecution,
  PROJECT_ROOT,
  toProjectRelative,
} from "./utils.js";

interface SingleCliOptions {
  input?: string;
  stdin?: boolean;
  json?: string;
  outputDir?: string;
}

export interface SingleRenderResult {
  outputPath: string;
  relativeOutputPath: string;
  fileName: string;
  theme: string;
  icon: string;
  layout: LayoutMetrics;
}

function parseSingleCliArgs(argv = process.argv.slice(2)): SingleCliOptions {
  const options: SingleCliOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const [flag, inlineValue] = argument.split("=", 2);
    const nextValue = inlineValue ?? argv[index + 1];

    if (flag === "--stdin") {
      options.stdin = true;
    } else if (flag === "--input" && nextValue) {
      options.input = nextValue;
      if (inlineValue === undefined) index += 1;
    } else if (flag === "--json" && nextValue) {
      options.json = nextValue;
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

function readJsonSource(options: SingleCliOptions): { text: string; sourceName: string } {
  const sourceCount = Number(Boolean(options.input)) + Number(Boolean(options.stdin)) + Number(Boolean(options.json));
  if (sourceCount !== 1) {
    throw new Error("Use exactly one input source: --input <file>, --stdin, or --json <string>.");
  }

  if (options.input) {
    const inputPath = path.resolve(PROJECT_ROOT, options.input);
    return { text: fs.readFileSync(inputPath, "utf8"), sourceName: path.basename(inputPath) };
  }
  if (options.stdin) {
    return { text: fs.readFileSync(0, "utf8"), sourceName: "stdin" };
  }
  return { text: options.json!, sourceName: "--json" };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new SingleInputValidationError([
      { field: "$", value: text, correction: `유효한 JSON 문법으로 수정하세요. (${errorMessage(error)})` },
    ]);
  }
}

function isSeriesRequest(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.schema_version === "2.0" || record.schema_version === "2.1" || record.task === "render_series";
}

export async function renderSingleJson(
  jsonValue: unknown,
  sourceName: string,
  outputRoot = path.join(PROJECT_ROOT, "output"),
): Promise<SingleRenderResult> {
  const input = parseSingleRenderInput(jsonValue);
  const row = singleInputToCoverRow(input, sourceName);
  const outputDirectory = path.join(outputRoot, row.theme);
  const outputPath = path.join(outputDirectory, row.file_name);

  if (fs.existsSync(outputPath)) {
    throw new Error(`이미 파일이 존재합니다. 기존 파일을 조용히 덮어쓰지 않습니다: ${toProjectRelative(outputPath)}`);
  }

  ensureDirectory(outputDirectory);
  const browser = await launchRendererBrowser();
  const context = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    const layout = await renderOne(page, row, outputPath);
    return {
      outputPath,
      relativeOutputPath: toProjectRelative(outputPath),
      fileName: row.file_name,
      theme: row.theme,
      icon: row.icon,
      layout,
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

function formatOverflow(error: LayoutOverflowError): string {
  const { layout, row } = error;
  const lines = ["렌더링 오류: 최소 허용 글자 크기에서도 지정 영역을 넘습니다."];
  if (layout.titleOverflow) {
    lines.push(
      `- 영역: cover_title`,
      `  문구: ${JSON.stringify(row.cover_title.split("|"))}`,
      `  측정: ${layout.titleWidth}×${layout.titleHeight}, 허용: ${layout.titleAvailableWidth}×${layout.titleAvailableHeight}, 글자: ${layout.titleFontSize}px`,
    );
  }
  if (layout.subtitleOverflow) {
    lines.push(
      `- 영역: subtitle`,
      `  문구: ${JSON.stringify(row.subtitle.split("|"))}`,
      `  측정: ${layout.subtitleWidth}×${layout.subtitleHeight}, 허용: ${layout.subtitleAvailableWidth}×${layout.subtitleAvailableHeight}, 글자: ${layout.subtitleFontSize}px`,
    );
  }
  return lines.join("\n");
}

function formatSeriesOverflow(error: SeriesLayoutOverflowError): string {
  const lines = [`렌더링 오류: 카드 ${error.card.card_no} (${error.card.layout})의 텍스트가 최소 허용 글자 크기에서도 지정 영역을 넘습니다.`];
  for (const metric of error.metrics.text.filter((entry) => entry.overflow)) {
    lines.push(
      `- 카드: ${error.card.card_no}`,
      `  레이아웃: ${error.card.layout}`,
      `  필드: ${metric.field}`,
      `  측정: ${metric.width}×${metric.height}px, 허용: ${metric.availableWidth}×${metric.availableHeight}px, 최소 글자: ${metric.fontSize}px`,
      "  수정 방법: 해당 문구의 길이를 줄이거나 배열 항목을 허용 범위 안에서 나누세요. 렌더러는 내용을 자르지 않습니다.",
    );
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const options = parseSingleCliArgs();
  const source = readJsonSource(options);
  const outputRoot = options.outputDir ? path.resolve(PROJECT_ROOT, options.outputDir) : path.join(PROJECT_ROOT, "output");
  const jsonValue = parseJson(source.text);
  if (isSeriesRequest(jsonValue)) {
    const result = await renderSeriesJson(jsonValue, outputRoot, (message) => console.log(message));
    for (const card of result.cards) console.log(`Created: ${card.relativeOutputPath}`);
    console.log(`Output folder: ${result.relativeOutputDirectory}`);
    console.log(`Rendered ${result.cards.length}/${result.cards.length} series cards.`);
  } else {
    const result = await renderSingleJson(jsonValue, source.sourceName, outputRoot);
    console.log(`Created: ${result.relativeOutputPath}`);
    console.log(`Theme: ${result.theme}; icon: ${result.icon}`);
    console.log(`Font sizes: title ${result.layout.titleFontSize}px; subtitle ${result.layout.subtitleFontSize}px`);
  }
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    if (error instanceof SingleInputValidationError) {
      console.error(formatSingleInputError(error));
    } else if (error instanceof SeriesInputValidationError) {
      console.error(formatSeriesInputError(error));
    } else if (error instanceof LayoutOverflowError) {
      console.error(formatOverflow(error));
    } else if (error instanceof SeriesLayoutOverflowError) {
      console.error(formatSeriesOverflow(error));
    } else {
      console.error(`Rendering failed: ${errorMessage(error)}`);
    }
    process.exitCode = 1;
  });
}
