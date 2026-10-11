import fs from "node:fs";
import path from "node:path";
import type { Browser } from "playwright";
import { launchRendererBrowser } from "./browser.js";
import { renderSeriesCard, type SeriesCardLayoutMetrics } from "./renderSeriesCard.js";
import { parseSeriesRenderInput, type SeriesRenderInput } from "./seriesInputSchema.js";
import { createSeriesTemporaryDirectory, resolveSeriesOutputDirectory } from "./seriesPaths.js";
import { toProjectRelative } from "./utils.js";

export interface SeriesCardRenderResult {
  cardNo: number;
  role: string;
  layout: string;
  imageName: string;
  outputPath: string;
  relativeOutputPath: string;
  metrics: SeriesCardLayoutMetrics;
}

export interface SeriesRenderResult {
  outputDirectory: string;
  relativeOutputDirectory: string;
  coverPath: string;
  cards: SeriesCardRenderResult[];
}

export type SeriesProgress = (message: string) => void;

export async function renderSeriesJson(
  jsonValue: unknown,
  outputRoot: string,
  onProgress?: SeriesProgress,
): Promise<SeriesRenderResult> {
  const input: SeriesRenderInput = parseSeriesRenderInput(jsonValue);
  const finalDirectory = resolveSeriesOutputDirectory(outputRoot, input.post_title);
  if (fs.existsSync(finalDirectory)) {
    throw new Error(`이미 출력 폴더가 존재합니다. 기존 시리즈를 조용히 덮어쓰지 않습니다: ${toProjectRelative(finalDirectory)}`);
  }

  const folderName = path.basename(finalDirectory);
  const temporaryDirectory = createSeriesTemporaryDirectory(path.resolve(outputRoot), folderName);
  let browser: Browser | undefined;
  const temporaryResults: Array<Omit<SeriesCardRenderResult, "outputPath" | "relativeOutputPath">> = [];

  onProgress?.(`시리즈 ${input.cards.length}장 렌더링 시작: ${toProjectRelative(finalDirectory)}`);
  try {
    browser = await launchRendererBrowser();
    for (const [index, card] of input.cards.entries()) {
      const temporaryPath = path.join(temporaryDirectory, card.image_name);
      const cardContext = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
      const page = await cardContext.newPage();
      try {
        const metrics = await renderSeriesCard(page, input, card, temporaryPath);
        temporaryResults.push({
          cardNo: card.card_no,
          role: card.role,
          layout: card.layout,
          imageName: card.image_name,
          metrics,
        });
        onProgress?.(`[${index + 1}/${input.cards.length}] ${card.role} / ${card.layout} / ${card.image_name}: 성공`);
      } catch (error) {
        onProgress?.(`[${index + 1}/${input.cards.length}] ${card.role} / ${card.layout} / ${card.image_name}: 실패`);
        throw error;
      } finally {
        await cardContext.close();
      }
    }
    if (fs.existsSync(finalDirectory)) {
      throw new Error(`렌더링 중 같은 출력 폴더가 생성되었습니다. 기존 폴더를 덮어쓰지 않습니다: ${toProjectRelative(finalDirectory)}`);
    }
    fs.renameSync(temporaryDirectory, finalDirectory);
  } catch (error) {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    throw error;
  } finally {
    await browser?.close();
  }

  const cards: SeriesCardRenderResult[] = temporaryResults.map((result) => {
    const outputPath = path.join(finalDirectory, result.imageName);
    return { ...result, outputPath, relativeOutputPath: toProjectRelative(outputPath) };
  });
  return {
    outputDirectory: finalDirectory,
    relativeOutputDirectory: toProjectRelative(finalDirectory),
    coverPath: cards[0].outputPath,
    cards,
  };
}
