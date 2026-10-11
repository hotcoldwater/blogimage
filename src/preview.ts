import fs from "node:fs";
import path from "node:path";
import { loadWorkbooks } from "./loadExcel.js";
import { normalizeWorkbooks, normalizeTheme, type CoverRow } from "./normalizeData.js";
import { CONTENT_THEME_NAMES, outputTheme } from "./themes.js";
import {
  errorMessage,
  escapeHtml,
  isDirectExecution,
  normalizePngFileName,
  parseCliArgs,
  PROJECT_ROOT,
} from "./utils.js";

interface GalleryEntry {
  output_path: string;
  file_name: string;
  title: string;
  category: string;
  theme: string;
  id: string;
}

interface RenderManifest {
  entries?: GalleryEntry[];
}

function entriesFromManifest(): GalleryEntry[] {
  const manifestPath = path.join(PROJECT_ROOT, "reports", "render-manifest.json");
  if (!fs.existsSync(manifestPath)) return [];
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as RenderManifest;
    return (manifest.entries ?? []).filter((entry) => fs.existsSync(path.join(PROJECT_ROOT, entry.output_path)));
  } catch {
    return [];
  }
}

function entriesFromOutput(rows: CoverRow[]): GalleryEntry[] {
  const outputDirectory = path.join(PROJECT_ROOT, "output");
  if (!fs.existsSync(outputDirectory)) return [];

  const rowLookup = new Map<string, CoverRow[]>();
  for (const row of rows) {
    const key = normalizePngFileName(row.file_name).toLocaleLowerCase("en-US");
    if (!key) continue;
    rowLookup.set(key, [...(rowLookup.get(key) ?? []), row]);
  }

  const entries: GalleryEntry[] = [];
  for (const theme of [...CONTENT_THEME_NAMES, "misc"]) {
    const themeDirectory = path.join(outputDirectory, theme);
    if (!fs.existsSync(themeDirectory)) continue;
    for (const entry of fs.readdirSync(themeDirectory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".png")) continue;
      const row = rowLookup.get(entry.name.toLocaleLowerCase("en-US"))?.[0];
      entries.push({
        output_path: path.join("output", theme, entry.name),
        file_name: entry.name,
        title: row?.cover_title.replaceAll("|", " / ") ?? "",
        category: row ? `${row.large_category} · ${row.small_category}` : "",
        theme,
        id: row?.id ?? "",
      });
    }
  }
  return entries;
}

function imageUrl(outputPath: string): string {
  return path
    .relative(path.join(PROJECT_ROOT, "preview"), path.join(PROJECT_ROOT, outputPath))
    .split(path.sep)
    .map(encodeURIComponent)
    .join("/");
}

function galleryHtml(entries: GalleryEntry[]): string {
  const themes = [...CONTENT_THEME_NAMES, "misc"];
  const sections = themes
    .map((theme) => {
      const matching = entries.filter((entry) => entry.theme === theme);
      if (matching.length === 0) return "";
      const cards = matching
        .map(
          (entry) => `
          <article class="card">
            <a href="${imageUrl(entry.output_path)}" target="_blank" rel="noreferrer">
              <img src="${imageUrl(entry.output_path)}" alt="${escapeHtml(entry.title || entry.file_name)}" loading="lazy">
            </a>
            <div class="meta">
              <strong>${escapeHtml(entry.title)}</strong>
              <span>${escapeHtml(entry.category)}</span>
              <code>${escapeHtml(entry.file_name)}</code>
            </div>
          </article>`,
        )
        .join("");
      return `<section><h2>${theme} <span>${matching.length}</span></h2><div class="grid">${cards}</div></section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blog cover preview</title>
  <style>
    :root { color-scheme: light; font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 48px; color: #17211e; background: #f3f1ec; }
    header { max-width: 1480px; margin: 0 auto 48px; }
    h1 { margin: 0 0 10px; font-size: 36px; letter-spacing: -.04em; }
    p { margin: 0; color: #65706c; }
    section { max-width: 1480px; margin: 0 auto 56px; }
    h2 { margin: 0 0 20px; font-size: 24px; text-transform: capitalize; }
    h2 span { color: #89928f; font-size: 15px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
    .card { overflow: hidden; border: 1px solid #dedbd4; border-radius: 12px; background: #fff; }
    .card a { display: block; background: #e8e5de; }
    img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
    .meta { display: grid; gap: 6px; padding: 16px; }
    strong { min-height: 1.4em; font-size: 16px; }
    span, code { color: #6e7774; font-size: 13px; }
    code { overflow-wrap: anywhere; }
    .empty { max-width: 1480px; margin: 0 auto; padding: 30px; border: 1px dashed #aaa; border-radius: 12px; }
  </style>
</head>
<body>
  <header><h1>Blog cover preview</h1><p>${entries.length} generated image(s)</p></header>
  ${sections || '<div class="empty">No generated PNG files found. Run <code>npm run render</code> first.</div>'}
</body>
</html>`;
}

export function generatePreview(explicitInput?: string, themeFilter?: string, limit?: number): string {
  let entries = entriesFromManifest();
  if (entries.length === 0) {
    let rows: CoverRow[] = [];
    try {
      rows = normalizeWorkbooks(loadWorkbooks(explicitInput));
    } catch {
      // A gallery can still be built from generated images without source workbooks.
    }
    entries = entriesFromOutput(rows);
  }

  if (themeFilter) {
    const normalized = outputTheme(normalizeTheme(themeFilter));
    entries = entries.filter((entry) => entry.theme === normalized);
  }
  if (limit) entries = entries.slice(0, limit);

  const previewDirectory = path.join(PROJECT_ROOT, "preview");
  fs.mkdirSync(previewDirectory, { recursive: true });
  const outputPath = path.join(previewDirectory, "index.html");
  fs.writeFileSync(outputPath, galleryHtml(entries), "utf8");
  return outputPath;
}

async function main(): Promise<void> {
  const options = parseCliArgs();
  const outputPath = generatePreview(options.input, options.theme, options.limit);
  console.log(`Preview gallery: ${path.relative(PROJECT_ROOT, outputPath)}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(`Preview generation failed: ${errorMessage(error)}`);
    process.exitCode = 1;
  });
}
