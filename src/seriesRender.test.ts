import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderSeriesJson } from "./renderSeries.js";
import { buildSeriesCardHtml } from "./renderSeriesCard.js";
import { renderSingleJson } from "./renderSingle.js";
import { parseSeriesRenderInput } from "./seriesInputSchema.js";
import { PROJECT_ROOT } from "./utils.js";

function readSample(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "samples", name), "utf8")) as unknown;
}

function pngDimensions(filePath: string): { width: number; height: number } {
  const bytes = fs.readFileSync(filePath);
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", `${filePath} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "blogimage-series-test-"));
try {
  const single = await renderSingleJson(readSample("single-v1.json"), "single-v1.json", temporaryRoot);
  assert.ok(fs.existsSync(single.outputPath));
  assert.deepEqual(pngDimensions(single.outputPath), { width: 1200, height: 1200 });

  const expectedCounts = new Map([
    ["series-3.json", 3], ["series-4.json", 4], ["series-5.json", 5],
    ["insurance-series-3.json", 3], ["insurance-series-4.json", 4], ["insurance-series-5.json", 5],
    ["jagak-investment-series-3.json", 3], ["jagak-realestate-series-4.json", 4],
    ["jagak-cpa-series-5.json", 5], ["jagak-it-series-4.json", 4],
    ["yeobaek-sports-series-4.json", 4],
    ["yeobaek_entertainment_issue.json", 3], ["yeobaek_broadcast_ott.json", 3],
    ["yeobaek_film_performance.json", 3], ["yeobaek_kpop_music.json", 3],
  ]);
  const seenLayouts = new Set<string>();
  for (const [sample, expectedCount] of expectedCounts) {
    const result = await renderSeriesJson(readSample(sample), temporaryRoot);
    assert.equal(result.cards.length, expectedCount);
    assert.ok(fs.existsSync(result.outputDirectory));
    assert.match(path.basename(result.outputDirectory), /[가-힣]/);
    assert.equal(/[\\/:*?"<>|]/.test(path.basename(result.outputDirectory)), false);
    for (const card of result.cards) {
      seenLayouts.add(card.layout);
      assert.ok(fs.existsSync(card.outputPath), card.outputPath);
      assert.equal(path.dirname(card.outputPath), result.outputDirectory);
      assert.deepEqual(pngDimensions(card.outputPath), { width: 1080, height: 1080 });
    }
    await assert.rejects(() => renderSeriesJson(readSample(sample), temporaryRoot), /이미 출력 폴더가 존재합니다/);
  }

  assert.deepEqual(
    [...seenLayouts].sort(),
    ["bullet_3", "cause_effect", "compare_2col", "conclusion", "cover", "numbers", "process_4"],
  );
  const insuranceInput = parseSeriesRenderInput(readSample("insurance-series-3.json"));
  const coverHtml = buildSeriesCardHtml(insuranceInput, insuranceInput.cards[0]);
  const conclusionHtml = buildSeriesCardHtml(insuranceInput, insuranceInput.cards[2]);
  assert.match(coverHtml, /data-theme="insurance"/);
  assert.match(coverHtml, /data-icon="book-open"/);
  assert.match(coverHtml, /보험기초/);
  assert.match(conclusionHtml, /conclusion-card/);
  assert.match(conclusionHtml, /--primary: #263B55/);
  assert.match(conclusionHtml, /data-icon="circle-check"/);
  assert.match(conclusionHtml, /이은옥의 보험이야기/);
  const jagakInvestment = parseSeriesRenderInput(readSample("jagak-investment-series-3.json"));
  const jagakInvestmentHtml = buildSeriesCardHtml(jagakInvestment, jagakInvestment.cards[0]);
  assert.match(jagakInvestmentHtml, /data-theme="jagak"/);
  assert.match(jagakInvestmentHtml, /--primary: #062D5B/);
  assert.match(jagakInvestmentHtml, /--secondary: #FF6847/);
  assert.match(jagakInvestmentHtml, /data-icon="key-round"/);
  assert.match(jagakInvestmentHtml, /자각: 기록의 온도/);
  const jagakRealEstate = parseSeriesRenderInput(readSample("jagak-realestate-series-4.json"));
  const jagakRealEstateConclusion = buildSeriesCardHtml(jagakRealEstate, jagakRealEstate.cards[3]);
  assert.match(jagakRealEstateConclusion, /--primary: #B42318/);
  assert.match(jagakRealEstateConclusion, /--soft: #FDECEA/);
  assert.match(jagakRealEstateConclusion, /conclusion-card/);
  const jagakCpa = parseSeriesRenderInput(readSample("jagak-cpa-series-5.json"));
  assert.match(buildSeriesCardHtml(jagakCpa, jagakCpa.cards[0]), /--primary: #1F5A45/);
  const jagakIt = parseSeriesRenderInput(readSample("jagak-it-series-4.json"));
  assert.match(buildSeriesCardHtml(jagakIt, jagakIt.cards[3]), /--primary: #B45309/);
  const sharedRealEstateRaw = readSample("jagak-investment-series-3.json") as Record<string, unknown>;
  sharedRealEstateRaw.post_title = "공유 소분류 팔레트 회귀";
  sharedRealEstateRaw.large_category = "부동산";
  sharedRealEstateRaw.small_category = "인사이트";
  const sharedRealEstate = parseSeriesRenderInput(sharedRealEstateRaw);
  const sharedRealEstateHtml = buildSeriesCardHtml(sharedRealEstate, sharedRealEstate.cards[0]);
  assert.match(sharedRealEstateHtml, /--primary: #B42318/);
  assert.match(sharedRealEstateHtml, /data-icon="key-round"/);
  const yeobaekSports = parseSeriesRenderInput(readSample("yeobaek-sports-series-4.json"));
  const yeobaekCoverHtml = buildSeriesCardHtml(yeobaekSports, yeobaekSports.cards[0]);
  const yeobaekConclusionHtml = buildSeriesCardHtml(yeobaekSports, yeobaekSports.cards[3]);
  assert.match(yeobaekCoverHtml, /data-theme="yeobaek"/);
  assert.match(yeobaekCoverHtml, /yeobaek-card/);
  assert.match(yeobaekCoverHtml, /--text: #242424/);
  assert.match(yeobaekCoverHtml, /--primary: #C45A2A/);
  assert.match(yeobaekCoverHtml, /data-icon="gamepad-2"/);
  assert.match(yeobaekCoverHtml, /여백: 지금을 읽다/);
  assert.match(yeobaekConclusionHtml, /conclusion-card/);
  assert.match(yeobaekConclusionHtml, /--primary: #C45A2A/);
  assert.match(yeobaekConclusionHtml, /data-icon="circle-check"/);
  const entertainmentSamples: Array<[string, string, string]> = [
    ["yeobaek_entertainment_issue.json", "연예이슈", "newspaper"],
    ["yeobaek_broadcast_ott.json", "방송·OTT", "tv"],
    ["yeobaek_film_performance.json", "영화·공연", "clapperboard"],
    ["yeobaek_kpop_music.json", "K팝·음악", "music-2"],
  ];
  for (const [sampleName, smallCategory, icon] of entertainmentSamples) {
    const input = parseSeriesRenderInput(readSample(sampleName));
    const cover = buildSeriesCardHtml(input, input.cards[0]);
    const conclusion = buildSeriesCardHtml(input, input.cards[input.cards.length - 1]);
    assert.match(cover, /--primary: #9B5C7C/);
    assert.match(cover, /--soft: #F4EAF0/);
    assert.match(cover, new RegExp(`data-icon="${icon}"`));
    assert.match(cover, new RegExp(smallCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(conclusion, /--primary: #9B5C7C/);
    assert.match(conclusion, /conclusion-card/);
  }
  const yeobaekConclusionPalettes: Array<[string, string, string]> = [
    ["사회·문화", "사회이슈", "#2F7D73"],
    ["정치·정책", "선거", "#5D4E86"],
    ["민생·경제", "민생", "#9A7425"],
    ["법·제도", "재판·판결", "#813F4A"],
    ["국제·정세", "국제정치", "#356A92"],
    ["스포츠", "축구", "#C45A2A"],
    ["연예·콘텐츠", "K팝·음악", "#9B5C7C"],
  ];
  for (const [largeCategory, smallCategory, primary] of yeobaekConclusionPalettes) {
    const raw = readSample("yeobaek-sports-series-4.json") as Record<string, unknown>;
    raw.large_category = largeCategory;
    raw.small_category = smallCategory;
    const input = parseSeriesRenderInput(raw);
    const html = buildSeriesCardHtml(input, input.cards[input.cards.length - 1]);
    assert.match(html, new RegExp(`--primary: ${primary}`));
    assert.match(html, /conclusion-card/);
  }
  assert.equal(fs.readdirSync(temporaryRoot).some((name) => name.includes(".tmp-")), false);
  console.log(`Series rendering tests passed (1 JSON 1.0 image, 56 series images, ${seenLayouts.size} layouts).`);
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
