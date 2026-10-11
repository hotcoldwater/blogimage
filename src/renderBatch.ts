import path from "node:path";
import { launchRendererBrowser } from "./browser.js";
import { loadWorkbooks } from "./loadExcel.js";
import { normalizeTheme, normalizeWorkbooks, type CoverRow } from "./normalizeData.js";
import { outputTheme } from "./themes.js";
import { renderOne, type LayoutMetrics } from "./renderOne.js";
import { createValidationReport, writeValidationReport } from "./validate.js";
import { generatePreview } from "./preview.js";
import {
  ensureDirectory,
  errorMessage,
  isDirectExecution,
  normalizePngFileName,
  parseCliArgs,
  PROJECT_ROOT,
  toProjectRelative,
  writeJson,
} from "./utils.js";

interface RenderResult {
  status: "rendered" | "skipped" | "failed";
  id: string;
  source_file: string;
  source_row: number;
  output_path?: string;
  file_name?: string;
  title?: string;
  category?: string;
  theme?: string;
  icon?: string;
  layout?: LayoutMetrics;
  message?: string;
}

function filteredRows(rows: CoverRow[], theme?: string, limit?: number): CoverRow[] {
  let filtered = rows;
  if (theme) {
    const normalizedTheme = normalizeTheme(theme);
    filtered = filtered.filter((row) => row.theme === normalizedTheme);
  }
  return limit ? filtered.slice(0, limit) : filtered;
}

async function renderBatch(): Promise<void> {
  const options = parseCliArgs();
  const workbooks = loadWorkbooks(options.input);
  const allRows = normalizeWorkbooks(workbooks);
  const validation = createValidationReport(workbooks, allRows);
  const customOutputRoot = options.outputDir ? path.resolve(PROJECT_ROOT, options.outputDir) : undefined;
  const outputRoot = customOutputRoot ?? path.join(PROJECT_ROOT, "output");
  if (customOutputRoot) {
    writeJson(path.join(customOutputRoot, "reports", "validation.json"), validation);
  } else {
    writeValidationReport(validation);
  }

  const rows = filteredRows(allRows, options.theme, options.limit);
  if (rows.length === 0) {
    throw new Error("No rows match the requested input/theme/limit options.");
  }

  const browser = await launchRendererBrowser();
  const context = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const results: RenderResult[] = [];

  try {
    for (const [index, row] of rows.entries()) {
      const fileName = normalizePngFileName(row.file_name);
      if (!fileName) {
        results.push({
          status: "skipped",
          id: row.id,
          source_file: row.source_file,
          source_row: row.source_row,
          message: "Missing file_name.",
        });
        console.warn(`[${index + 1}/${rows.length}] skipped row ${row.source_row}: missing file_name`);
        continue;
      }

      const theme = outputTheme(row.theme);
      const outputDirectory = path.join(outputRoot, theme);
      ensureDirectory(outputDirectory);
      const outputPath = path.join(outputDirectory, fileName);

      try {
        const layout = await renderOne(page, row, outputPath);
        results.push({
          status: "rendered",
          id: row.id,
          source_file: row.source_file,
          source_row: row.source_row,
          output_path: toProjectRelative(outputPath),
          file_name: fileName,
          title: row.cover_title.replaceAll("|", " / "),
          category: `${row.large_category} · ${row.small_category}`,
          theme,
          icon: row.icon,
          layout,
        });
        const overflow = layout.titleOverflow || layout.subtitleOverflow ? " (layout overflow)" : "";
        console.log(`[${index + 1}/${rows.length}] ${toProjectRelative(outputPath)}${overflow}`);
      } catch (error) {
        results.push({
          status: "failed",
          id: row.id,
          source_file: row.source_file,
          source_row: row.source_row,
          file_name: fileName,
          theme,
          message: errorMessage(error),
        });
        console.error(`[${index + 1}/${rows.length}] failed ${fileName}: ${errorMessage(error)}`);
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const rendered = results.filter((result) => result.status === "rendered");
  const failed = results.filter((result) => result.status === "failed");
  const skipped = results.filter((result) => result.status === "skipped");
  const layoutWarnings = rendered.filter((result) => result.layout?.titleOverflow || result.layout?.subtitleOverflow);
  const report = {
    generated_at: new Date().toISOString(),
    options,
    requested_rows: rows.length,
    rendered_count: rendered.length,
    failed_count: failed.length,
    skipped_count: skipped.length,
    layout_warning_count: layoutWarnings.length,
    results,
  };
  const reportDirectory = customOutputRoot ? path.join(customOutputRoot, "reports") : path.join(PROJECT_ROOT, "reports");
  writeJson(path.join(reportDirectory, "render-report.json"), report);
  writeJson(path.join(reportDirectory, "render-manifest.json"), {
    generated_at: report.generated_at,
    entries: rendered.map(({ output_path, file_name, title, category, theme, id }) => ({
      output_path,
      file_name,
      title,
      category,
      theme,
      id,
    })),
  });

  if (!customOutputRoot) generatePreview(options.input, options.theme, options.limit);
  console.log(
    `Rendered ${rendered.length}/${rows.length}; ${failed.length} failed, ${skipped.length} skipped, ${layoutWarnings.length} measured overflow warning(s).`,
  );
  if (!customOutputRoot) console.log("Gallery: preview/index.html");
  console.log(`Render report: ${toProjectRelative(path.join(reportDirectory, "render-report.json"))}`);
  if (failed.length > 0) process.exitCode = 1;
}

if (isDirectExecution(import.meta.url)) {
  renderBatch().catch((error) => {
    console.error(`Rendering failed: ${errorMessage(error)}`);
    process.exitCode = 1;
  });
}
