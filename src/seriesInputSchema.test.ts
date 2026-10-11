import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveInsuranceCardIcon, resolveSeriesThemeCardIcon } from "./renderSeriesCard.js";
import { parseSeriesRenderInput, SeriesInputValidationError } from "./seriesInputSchema.js";
import { resolveSeriesOutputDirectory, sanitizePostTitle } from "./seriesPaths.js";
import { PROJECT_ROOT } from "./utils.js";

function validSeries(): Record<string, any> {
  return {
    schema_version: "2.0",
    task: "render_series",
    post_title: "ISA 개편안 | 장기투자의 방향",
    large_category: "투자",
    small_category: "인사이트",
    canvas: { width: 1080, height: 1080 },
    cards: [
      {
        card_no: 1, role: "cover", layout: "cover", image_name: "01_cover.png",
        insert_token: "[[IMAGE_01:COVER:01_cover.png]]", title: ["한국 ISA", "왜 거꾸로 가나"], subtitle: ["장기투자 제한과", "복리효과 축소"],
      },
      {
        card_no: 2, role: "summary", layout: "bullet_3", image_name: "02_summary.png",
        insert_token: "[[IMAGE_02:SUMMARY:02_summary.png]]", title: ["이번 개편의", "핵심 3가지"], items: ["장기투자 유연성 축소", "계좌 활용 범위 제한", "반대 방향의 정책"],
      },
      {
        card_no: 3, role: "conclusion", layout: "conclusion", image_name: "03_conclusion.png",
        insert_token: "[[IMAGE_03:CONCLUSION:03_conclusion.png]]", title: ["장기투자를 말하면서", "유연성을 줄였다"], body: ["제약보다 활용 가능성을", "넓혀야 한다."],
      },
    ],
  };
}

assert.equal(parseSeriesRenderInput(validSeries()).cards.length, 3);
assert.equal(sanitizePostTitle(' 제목/위험:*? 값. '), "제목 - 위험 - 값");
assert.equal(sanitizePostTitle("CON"), "_CON");
assert.equal(resolveSeriesOutputDirectory("/tmp/blogimage", "가/나"), "/tmp/blogimage/가 - 나");

function sample(name: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "samples", name), "utf8")) as Record<string, any>;
}

for (const count of [3, 4, 5]) {
  const parsed = parseSeriesRenderInput(sample(`insurance-series-${count}.json`));
  assert.equal(parsed.schema_version, "2.1");
  assert.equal(parsed.theme, "insurance");
  assert.equal(parsed.cards.length, count);
}

const fallbackInput = parseSeriesRenderInput(sample("insurance-series-3.json"));
assert.equal(resolveInsuranceCardIcon(fallbackInput, fallbackInput.cards[0]), "book-open");
assert.equal(resolveInsuranceCardIcon(fallbackInput, fallbackInput.cards[1]), "list-checks");
assert.equal(resolveInsuranceCardIcon(fallbackInput, fallbackInput.cards[2]), "circle-check");
assert.equal(fallbackInput.cards[1].image_name, "02_summary.png");
assert.equal(fallbackInput.cards[1].insert_token, "[[IMAGE_02:SUMMARY:02_summary.png]]");

const insuranceCases: Array<[string, string, (value: Record<string, any>) => void]> = [
  ["insurance theme 누락", "theme", (value) => { delete value.theme; }],
  ["insurance theme 오류", "theme", (value) => { value.theme = "unknown"; }],
  ["insurance 대분류 오류", "large_category", (value) => { value.large_category = "투자"; }],
  ["insurance 소분류 오류", "small_category", (value) => { value.small_category = "알 수 없음"; }],
  ["insurance icon 오류", "cards[1].icon", (value) => { value.cards[1].icon = "brain"; }],
  ["insurance 연예 icon 격리", "cards[1].icon", (value) => { value.cards[1].icon = "tv"; }],
  ["compare 구형 배열", "cards[2].left", (value) => { value.cards[2].left = ["갱신형", "항목"]; }],
];

for (const [name, expectedField, mutate] of insuranceCases) {
  const value = sample("insurance-series-4.json");
  mutate(value);
  assert.throws(
    () => parseSeriesRenderInput(value),
    (error) => error instanceof SeriesInputValidationError && error.issues.some((issue) => issue.field === expectedField),
    name,
  );
}

const jagakSamples: Array<[string, number, string, string]> = [
  ["jagak-investment-series-3.json", 3, "투자", "인사이트"],
  ["jagak-realestate-series-4.json", 4, "부동산", "부동산제도"],
  ["jagak-cpa-series-5.json", 5, "CPA", "취업·커리어"],
  ["jagak-it-series-4.json", 4, "IT", "AI·Coding"],
];
for (const [name, count, large, small] of jagakSamples) {
  const parsed = parseSeriesRenderInput(sample(name));
  assert.equal(parsed.theme, "jagak");
  assert.equal(parsed.cards.length, count);
  assert.equal(parsed.large_category, large);
  assert.equal(parsed.small_category, small);
}

for (const [large, small] of [["투자", "인사이트"], ["부동산", "인사이트"], ["투자", "시장분석"], ["부동산", "시장분석"]]) {
  const value = sample("jagak-investment-series-3.json");
  value.large_category = large;
  value.small_category = small;
  assert.doesNotThrow(() => parseSeriesRenderInput(value), `${large}/${small}`);
}

const jagakFallback = parseSeriesRenderInput(sample("jagak-investment-series-3.json"));
assert.equal(resolveSeriesThemeCardIcon(jagakFallback, jagakFallback.cards[0]), "key-round");
assert.equal(resolveSeriesThemeCardIcon(jagakFallback, jagakFallback.cards[1]), "list-checks");
const jagakExplicit = parseSeriesRenderInput(sample("jagak-realestate-series-4.json"));
assert.equal(resolveSeriesThemeCardIcon(jagakExplicit, jagakExplicit.cards[0]), "scale");
assert.equal(jagakExplicit.cards[2].image_name, "03_comparison.png");
assert.equal(jagakExplicit.cards[2].insert_token, "[[IMAGE_03:COMPARISON:03_comparison.png]]");

const jagakCases: Array<[string, string, (value: Record<string, any>) => void]> = [
  ["jagak 대분류 오류", "large_category", (value) => { value.large_category = "스포츠"; }],
  ["jagak pair 오류", "small_category", (value) => { value.large_category = "CPA"; value.small_category = "시장분석"; }],
  ["구형 투자 소분류", "small_category", (value) => { value.small_category = "매크로분석"; }],
  ["구형 CPA 소분류", "small_category", (value) => { value.large_category = "CPA"; value.small_category = "정보"; }],
  ["구형 IT 소분류", "small_category", (value) => { value.large_category = "IT"; value.small_category = "AI뉴스"; }],
  ["jagak icon 오류", "cards[1].icon", (value) => { value.cards[1].icon = "brain"; }],
  ["jagak 연예 icon 격리", "cards[1].icon", (value) => { value.cards[1].icon = "music-2"; }],
];
for (const [name, expectedField, mutate] of jagakCases) {
  const value = sample("jagak-investment-series-3.json");
  mutate(value);
  assert.throws(
    () => parseSeriesRenderInput(value),
    (error) => error instanceof SeriesInputValidationError && error.issues.some((issue) => issue.field === expectedField),
    name,
  );
}

function yeobaekSeries(count: 3 | 4 | 5): Record<string, any> {
  const value = sample("yeobaek-sports-series-4.json");
  if (count === 3) {
    value.cards.splice(2, 1);
  } else if (count === 5) {
    value.cards.splice(3, 0, {
      card_no: 4,
      role: "process",
      layout: "process_4",
      image_name: "04_process.png",
      insert_token: "[[IMAGE_04:PROCESS:04_process.png]]",
      title: ["변화를 읽는", "네 단계"],
      steps: ["경기 일정을 확인합니다", "팀 전력을 살펴봅니다", "리그 지표를 비교합니다", "변화의 방향을 정리합니다"],
    });
  }
  const conclusion = value.cards[value.cards.length - 1];
  conclusion.card_no = count;
  conclusion.image_name = `${String(count).padStart(2, "0")}_conclusion.png`;
  conclusion.insert_token = `[[IMAGE_${String(count).padStart(2, "0")}:CONCLUSION:${conclusion.image_name}]]`;
  return value;
}

for (const count of [3, 4, 5] as const) {
  const parsed = parseSeriesRenderInput(yeobaekSeries(count));
  assert.equal(parsed.schema_version, "2.1");
  assert.equal(parsed.theme, "yeobaek");
  assert.equal(parsed.cards.length, count);
}

const yeobaekCategories: Record<string, string[]> = {
  "사회·문화": ["사회이슈", "교육", "인구·세대", "문화·생활"],
  "정치·정책": ["정치", "정책", "선거", "여론·쟁점"],
  "민생·경제": ["민생", "노동·고용", "복지·지원", "생활경제"],
  "법·제도": ["사건·수사", "재판·판결", "법률·제도", "권리·분쟁"],
  "국제·정세": ["국제정치", "전쟁·안보", "국제경제", "해외이슈"],
  스포츠: ["축구", "야구", "농구", "E스포츠", "기타스포츠"],
  "연예·콘텐츠": ["연예이슈", "방송·OTT", "영화·공연", "K팝·음악"],
};
let yeobaekPairCount = 0;
for (const [large, smallCategories] of Object.entries(yeobaekCategories)) {
  for (const small of smallCategories) {
    yeobaekPairCount += 1;
    const value = yeobaekSeries(3);
    value.large_category = large;
    value.small_category = small;
    assert.doesNotThrow(() => parseSeriesRenderInput(value), `${large}/${small}`);
  }
}

const yeobaekFallback = parseSeriesRenderInput(yeobaekSeries(3));
assert.equal(resolveSeriesThemeCardIcon(yeobaekFallback, yeobaekFallback.cards[0]), "gamepad-2");
assert.equal(resolveSeriesThemeCardIcon(yeobaekFallback, yeobaekFallback.cards[1]), "list-checks");
assert.equal(resolveSeriesThemeCardIcon(yeobaekFallback, yeobaekFallback.cards[2]), "circle-check");
const yeobaekExplicitRaw = yeobaekSeries(3);
yeobaekExplicitRaw.cards[0].icon = "football";
const yeobaekExplicit = parseSeriesRenderInput(yeobaekExplicitRaw);
assert.equal(resolveSeriesThemeCardIcon(yeobaekExplicit, yeobaekExplicit.cards[0]), "football");

const entertainmentIcons: Record<string, string> = {
  연예이슈: "newspaper",
  "방송·OTT": "tv",
  "영화·공연": "clapperboard",
  "K팝·음악": "music-2",
};
for (const [smallCategory, icon] of Object.entries(entertainmentIcons)) {
  const value = yeobaekSeries(3);
  value.large_category = "연예·콘텐츠";
  value.small_category = smallCategory;
  value.cards[0].icon = icon;
  const parsed = parseSeriesRenderInput(value);
  assert.equal(resolveSeriesThemeCardIcon(parsed, parsed.cards[0]), icon, smallCategory);
}

const entertainmentInvalidPairs: Array<[string, string]> = [
  ["연예·콘텐츠", "사회이슈"],
  ["연예·콘텐츠", "음악"],
  ["사회·문화", "K팝·음악"],
  ["연예/콘텐츠", "K팝·음악"],
  ["연예", "K팝·음악"],
  ["연예계", "K팝·음악"],
  ["연예·콘텐츠", "방송/OTT"],
  ["연예·콘텐츠", "K팝/음악"],
];
for (const [largeCategory, smallCategory] of entertainmentInvalidPairs) {
  const value = yeobaekSeries(3);
  value.large_category = largeCategory;
  value.small_category = smallCategory;
  assert.throws(
    () => parseSeriesRenderInput(value),
    (error) => error instanceof SeriesInputValidationError
      && error.issues.some((issue) => issue.field === (largeCategory === "연예·콘텐츠" || largeCategory === "사회·문화" ? "small_category" : "large_category")),
    `${largeCategory}/${smallCategory}`,
  );
}

for (const theme of ["jagak", "insurance"]) {
  const value = yeobaekSeries(3);
  value.theme = theme;
  value.large_category = "연예·콘텐츠";
  value.small_category = "연예이슈";
  assert.throws(
    () => parseSeriesRenderInput(value),
    (error) => error instanceof SeriesInputValidationError && error.issues.some((issue) => issue.field === "large_category"),
    `${theme} theme isolation`,
  );
}

const yeobaekCases: Array<[string, string, (value: Record<string, any>) => void]> = [
  ["yeobaek 대분류 오류", "large_category", (value) => { value.large_category = "CPA"; }],
  ["yeobaek pair 오류", "small_category", (value) => { value.large_category = "스포츠"; value.small_category = "TechNews"; }],
  ["yeobaek icon 오류", "cards[1].icon", (value) => { value.cards[1].icon = "brain"; }],
  ["yeobaek compare 구형 배열", "cards[2].left", (value) => { value.cards[2].left = ["경기", "항목"]; }],
];
for (const [name, expectedField, mutate] of yeobaekCases) {
  const value = yeobaekSeries(4);
  mutate(value);
  assert.throws(
    () => parseSeriesRenderInput(value),
    (error) => error instanceof SeriesInputValidationError && error.issues.some((issue) => issue.field === expectedField),
    name,
  );
}

const cases: Array<[string, string, (value: Record<string, any>) => void]> = [
  ["카드 2개", "cards", (value) => { value.cards = value.cards.slice(0, 2); }],
  ["카드 6개", "cards", (value) => { value.cards = Array.from({ length: 6 }, (_, index) => ({ ...value.cards[1], card_no: index + 1 })); }],
  ["card_no 누락", "cards[1].card_no", (value) => { delete value.cards[1].card_no; }],
  ["card_no 중복", "cards[1].card_no", (value) => { value.cards[1].card_no = 1; }],
  ["첫 role", "cards[0].role", (value) => { value.cards[0].role = "impact"; }],
  ["둘째 role", "cards[1].role", (value) => { value.cards[1].role = "impact"; }],
  ["마지막 role", "cards[2].role", (value) => { value.cards[2].role = "impact"; }],
  ["중복 image_name", "cards[1].image_name", (value) => { value.cards[1].image_name = "01_cover.png"; }],
  ["토큰 순번", "cards[1].insert_token", (value) => { value.cards[1].insert_token = "[[IMAGE_03:SUMMARY:02_summary.png]]"; }],
  ["토큰 역할", "cards[1].insert_token", (value) => { value.cards[1].insert_token = "[[IMAGE_02:IMPACT:02_summary.png]]"; }],
  ["토큰 파일명", "cards[1].insert_token", (value) => { value.cards[1].insert_token = "[[IMAGE_02:SUMMARY:wrong.png]]"; }],
  ["알 수 없는 role", "cards[1].role", (value) => { value.cards[1].role = "unknown"; }],
  ["알 수 없는 layout", "cards[1].layout", (value) => { value.cards[1].layout = "unknown"; }],
  ["필수 필드 누락", "cards[1].items", (value) => { delete value.cards[1].items; }],
  ["items 부족", "cards[1].items", (value) => { value.cards[1].items = ["하나", "둘"]; }],
  ["cover subtitle 누락", "cards[0].subtitle", (value) => { delete value.cards[0].subtitle; }],
  ["compare 필드 누락", "cards[1].left", (value) => { value.cards[1] = { ...value.cards[1], layout: "compare_2col" }; delete value.cards[1].items; }],
  ["process steps 누락", "cards[1].steps", (value) => { value.cards[1] = { ...value.cards[1], layout: "process_4" }; delete value.cards[1].items; }],
  ["cause 필드 누락", "cards[1].causes", (value) => { value.cards[1] = { ...value.cards[1], layout: "cause_effect" }; delete value.cards[1].items; }],
  ["numbers 필드 누락", "cards[1].numbers", (value) => { value.cards[1] = { ...value.cards[1], layout: "numbers" }; delete value.cards[1].items; }],
  ["conclusion 필드 누락", "cards[2]", (value) => { delete value.cards[2].body; }],
  ["steps 초과", "cards[1].steps", (value) => { value.cards[1] = { ...value.cards[1], layout: "process_4", steps: ["1", "2", "3", "4", "5"] }; delete value.cards[1].items; }],
  ["경로 순회", "cards[1].image_name", (value) => { value.cards[1].image_name = "../escape.png"; }],
  ["빈 post_title", "post_title", (value) => { value.post_title = " "; }],
  ["정제 후 빈 post_title", "post_title", (value) => { value.post_title = "/:*?"; }],
  ["canvas", "canvas.width", (value) => { value.canvas.width = 1200; }],
  ["텍스트 길이", "cards[1].items[0]", (value) => { value.cards[1].items[0] = "가".repeat(33); }],
  ["conclusion 양식 중복", "cards[2]", (value) => { value.cards[2].items = ["하나", "둘", "셋"]; }],
];

for (const [name, expectedField, mutate] of cases) {
  const value = validSeries();
  mutate(value);
  assert.throws(
    () => parseSeriesRenderInput(value),
    (error) => error instanceof SeriesInputValidationError && error.issues.some((issue) => issue.field === expectedField),
    name,
  );
}

console.log(`Series-input schema tests passed (${cases.length + insuranceCases.length + jagakCases.length + yeobaekCases.length + yeobaekPairCount + 50} cases).`);
