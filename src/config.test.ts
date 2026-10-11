import assert from "node:assert/strict";
import { CATEGORY_MAPPINGS } from "./categoryMappings.js";
import { getIconSvg, isSupportedIcon } from "./iconRegistry.js";
import {
  isContentTheme,
  seriesThemeCategoryIcon,
  seriesThemeCategoryPalette,
  seriesThemeDefinition,
  seriesThemeIconNames,
  themeDefinition,
} from "./themes.js";

let combinationCount = 0;
for (const [largeCategory, definition] of Object.entries(CATEGORY_MAPPINGS)) {
  assert.ok(isContentTheme(definition.theme), `${largeCategory}: unsupported theme ${definition.theme}`);
  assert.equal(themeDefinition(definition.theme).name, definition.theme);
  for (const [smallCategory, icon] of Object.entries(definition.icons)) {
    combinationCount += 1;
    assert.ok(isSupportedIcon(icon), `${largeCategory}/${smallCategory}: unsupported icon ${icon}`);
    assert.match(getIconSvg(icon) ?? "", /^<svg[\s\S]*<\/svg>\s*$/);
  }
}

assert.equal(combinationCount, 21);

const insurance = seriesThemeDefinition("insurance");
const insurancePalette = seriesThemeCategoryPalette("insurance", "보험")!;
assert.deepEqual(
  {
    background: insurance.background,
    surface: insurance.surface,
    primary: insurancePalette.primary,
    secondary: insurancePalette.secondary,
    soft: insurancePalette.soft,
    text: insurance.text,
    muted: insurance.muted,
    border: insurance.border,
    conclusionText: insurance.conclusionText,
  },
  {
    background: "#FAFAF7",
    surface: "#FFFFFF",
    primary: "#263B55",
    secondary: "#7894AE",
    soft: "#EAF1F6",
    text: "#34383D",
    muted: "#747B84",
    border: "#DDE3E8",
    conclusionText: "#FFFFFF",
  },
);
assert.equal(insurance.brandName, "이은옥의 보험이야기");
for (const icon of seriesThemeIconNames("insurance")) {
  assert.ok(isSupportedIcon(icon));
  assert.match(getIconSvg(icon) ?? "", /^<svg[\s\S]*<\/svg>\s*$/);
}

const jagak = seriesThemeDefinition("jagak");
assert.equal(jagak.brandName, "자각: 기록의 온도");
assert.equal(jagak.background, themeDefinition("investment").upperBackground);
assert.equal(jagak.conclusionText, themeDefinition("investment").lowerForeground);
const investment = seriesThemeCategoryPalette("jagak", "투자")!;
const realEstate = seriesThemeCategoryPalette("jagak", "부동산")!;
const cpa = seriesThemeCategoryPalette("jagak", "CPA")!;
const it = seriesThemeCategoryPalette("jagak", "IT")!;
assert.equal(investment.primary, themeDefinition("investment").primary);
assert.equal(investment.secondary, themeDefinition("investment").accent);
assert.equal(cpa.primary, themeDefinition("cpa").primary);
assert.equal(cpa.secondary, themeDefinition("cpa").accent);
assert.deepEqual(realEstate, { primary: "#B42318", secondary: "#D65A4A", soft: "#FDECEA" });
assert.deepEqual(it, { primary: "#B45309", secondary: "#D97706", soft: "#FFF0DC" });
assert.notEqual(realEstate.primary, it.primary);
for (const icon of seriesThemeIconNames("jagak")) {
  assert.ok(isSupportedIcon(icon));
  assert.match(getIconSvg(icon) ?? "", /^<svg[\s\S]*<\/svg>\s*$/);
}

const yeobaek = seriesThemeDefinition("yeobaek");
assert.deepEqual(
  {
    background: yeobaek.background,
    surface: yeobaek.surface,
    text: yeobaek.text,
    muted: yeobaek.muted,
    border: yeobaek.border,
    conclusionText: yeobaek.conclusionText,
    brandName: yeobaek.brandName,
  },
  {
    background: "#F8F8F6",
    surface: "#FFFFFF",
    text: "#242424",
    muted: "#707070",
    border: "#E1E1DE",
    conclusionText: "#FFFFFF",
    brandName: "여백: 지금을 읽다",
  },
);
const yeobaekPalettes: Record<string, { primary: string; soft: string }> = {
  "사회·문화": { primary: "#2F7D73", soft: "#E7F1EE" },
  "정치·정책": { primary: "#5D4E86", soft: "#EEEAF5" },
  "민생·경제": { primary: "#9A7425", soft: "#F5EFD9" },
  "법·제도": { primary: "#813F4A", soft: "#F4E8EA" },
  "국제·정세": { primary: "#356A92", soft: "#E7EEF4" },
  스포츠: { primary: "#C45A2A", soft: "#F7E9E2" },
  "연예·콘텐츠": { primary: "#9B5C7C", soft: "#F4EAF0" },
};
for (const [largeCategory, expected] of Object.entries(yeobaekPalettes)) {
  const palette = seriesThemeCategoryPalette("yeobaek", largeCategory)!;
  assert.equal(palette.primary, expected.primary, `${largeCategory} primary`);
  assert.equal(palette.soft, expected.soft, `${largeCategory} soft`);
}
const yeobaekIcons: Record<string, Record<string, string>> = {
  "사회·문화": { 사회이슈: "users-round", 교육: "graduation-cap", "인구·세대": "users", "문화·생활": "sparkles" },
  "정치·정책": { 정치: "landmark", 정책: "file-text", 선거: "vote", "여론·쟁점": "messages-square" },
  "민생·경제": { 민생: "wallet", "노동·고용": "briefcase", "복지·지원": "hand-heart", 생활경제: "receipt" },
  "법·제도": { "사건·수사": "search", "재판·판결": "gavel", "법률·제도": "scale", "권리·분쟁": "shield-check" },
  "국제·정세": { 국제정치: "globe-2", "전쟁·안보": "shield", 국제경제: "chart-no-axes-combined", 해외이슈: "earth" },
  스포츠: { 축구: "football", 야구: "baseball", 농구: "basketball", E스포츠: "gamepad-2", 기타스포츠: "medal" },
  "연예·콘텐츠": { 연예이슈: "newspaper", "방송·OTT": "tv", "영화·공연": "clapperboard", "K팝·음악": "music-2" },
};
let yeobaekCombinationCount = 0;
for (const [largeCategory, icons] of Object.entries(yeobaekIcons)) {
  for (const [smallCategory, icon] of Object.entries(icons)) {
    yeobaekCombinationCount += 1;
    assert.equal(seriesThemeCategoryIcon("yeobaek", largeCategory, smallCategory), icon);
  }
}
assert.equal(yeobaekCombinationCount, 29);
for (const icon of seriesThemeIconNames("yeobaek")) {
  assert.ok(isSupportedIcon(icon), `yeobaek unsupported icon ${icon}`);
  assert.match(getIconSvg(icon) ?? "", /^<svg[\s\S]*<\/svg>\s*$/);
}

console.log(`Category/theme/icon configuration tests passed (${combinationCount} legacy combinations + insurance + jagak + ${yeobaekCombinationCount} yeobaek combinations).`);
