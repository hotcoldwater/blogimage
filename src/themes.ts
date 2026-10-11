import type { SupportedIcon } from "./iconRegistry.js";

export const CONTENT_THEME_NAMES = ["investment", "cpa", "it", "sports", "south-sudan", "record"] as const;
export const SERIES_THEME_NAMES = ["insurance", "jagak", "yeobaek"] as const;

export type ContentTheme = (typeof CONTENT_THEME_NAMES)[number];
export type OutputTheme = ContentTheme | "misc";
export type SeriesThemeName = (typeof SERIES_THEME_NAMES)[number];

export interface ThemeDefinition {
  name: OutputTheme;
  upperBackground: string;
  primary: string;
  lowerBackground: string;
  accent: string;
  lowerForeground: string;
}

export interface SeriesCategoryPalette {
  primary: string;
  secondary: string;
  soft: string;
}

export interface SeriesCategoryDefinition {
  palette: SeriesCategoryPalette;
  icons: Record<string, SupportedIcon>;
}

export interface SeriesThemeDefinition {
  name: SeriesThemeName;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  conclusionText: string;
  brandName: string;
  categories: Record<string, SeriesCategoryDefinition>;
  roleIcons: Record<string, SupportedIcon>;
}

export const SERIES_ROLE_ICONS: Record<string, SupportedIcon> = {
  summary: "list-checks",
  key_point: "key-round",
  comparison: "arrow-left-right",
  process: "list-ordered",
  cause_effect: "arrow-right",
  pros_cons: "scale",
  impact: "circle-dot",
  risk: "triangle-alert",
  numbers: "calculator",
  checklist: "clipboard-check",
  conclusion: "circle-check",
};

export const THEMES: Record<OutputTheme, ThemeDefinition> = {
  investment: {
    name: "investment",
    upperBackground: "#F7F2E9",
    primary: "#062D5B",
    lowerBackground: "#062D5B",
    accent: "#FF6847",
    lowerForeground: "#F6F1E8",
  },
  cpa: {
    name: "cpa",
    upperBackground: "#F7F2E9",
    primary: "#1F5A45",
    lowerBackground: "#1F5A45",
    accent: "#8FB89B",
    lowerForeground: "#F6F1E8",
  },
  it: {
    name: "it",
    upperBackground: "#F7F2E9",
    primary: "#245B8A",
    lowerBackground: "#245B8A",
    accent: "#73A6C9",
    lowerForeground: "#F6F1E8",
  },
  sports: {
    name: "sports",
    upperBackground: "#F7F2E9",
    primary: "#7A2E3A",
    lowerBackground: "#7A2E3A",
    accent: "#D08A78",
    lowerForeground: "#F6F1E8",
  },
  "south-sudan": {
    name: "south-sudan",
    upperBackground: "#F7F2E9",
    primary: "#766039",
    lowerBackground: "#766039",
    accent: "#C6A45E",
    lowerForeground: "#F6F1E8",
  },
  record: {
    name: "record",
    upperBackground: "#F7F2E9",
    primary: "#62516D",
    lowerBackground: "#62516D",
    accent: "#B49BC0",
    lowerForeground: "#F6F1E8",
  },
  misc: {
    name: "misc",
    upperBackground: "#F7F2E9",
    primary: "#33413D",
    lowerBackground: "#33413D",
    accent: "#A6B2AA",
    lowerForeground: "#F6F1E8",
  },
};

export const SERIES_THEMES: Record<SeriesThemeName, SeriesThemeDefinition> = {
  insurance: {
    name: "insurance",
    background: "#FAFAF7",
    surface: "#FFFFFF",
    text: "#34383D",
    muted: "#747B84",
    border: "#DDE3E8",
    conclusionText: "#FFFFFF",
    brandName: "이은옥의 보험이야기",
    categories: {
      보험: {
        palette: { primary: "#263B55", secondary: "#7894AE", soft: "#EAF1F6" },
        icons: {
          보험기초: "book-open",
          보험이야기: "message-circle",
          보장정보: "shield-check",
          보험점검: "clipboard-check",
          아카이브: "archive",
        },
      },
    },
    roleIcons: SERIES_ROLE_ICONS,
  },
  jagak: {
    name: "jagak",
    background: "#F7F2E9",
    surface: "#FFFFFF",
    text: "#34383D",
    muted: "#747B84",
    border: "#D9D3C8",
    conclusionText: "#F6F1E8",
    brandName: "자각: 기록의 온도",
    categories: {
      투자: {
        palette: { primary: "#062D5B", secondary: "#FF6847", soft: "#E8EEF4" },
        icons: {
          투자기초: "book-open",
          인사이트: "key-round",
          시장분석: "chart-line",
          기업분석: "building-2",
          투자전략: "target",
        },
      },
      부동산: {
        palette: { primary: "#B42318", secondary: "#D65A4A", soft: "#FDECEA" },
        icons: {
          부동산기초: "house",
          인사이트: "key-round",
          시장분석: "chart-line",
          지역분석: "map-pin",
          부동산제도: "scale",
          "청약·분양": "building",
        },
      },
      CPA: {
        palette: { primary: "#1F5A45", secondary: "#8FB89B", soft: "#E8F0EC" },
        icons: {
          수험생활: "book-open",
          "취업·커리어": "briefcase",
          "업계·실무": "clipboard-check",
        },
      },
      IT: {
        palette: { primary: "#B45309", secondary: "#D97706", soft: "#FFF0DC" },
        icons: {
          TechNews: "newspaper",
          "AI·Coding": "code-2",
          Projects: "blocks",
        },
      },
    },
    roleIcons: SERIES_ROLE_ICONS,
  },
  yeobaek: {
    name: "yeobaek",
    background: "#F8F8F6",
    surface: "#FFFFFF",
    text: "#242424",
    muted: "#707070",
    border: "#E1E1DE",
    conclusionText: "#FFFFFF",
    brandName: "여백: 지금을 읽다",
    categories: {
      "사회·문화": {
        palette: { primary: "#2F7D73", secondary: "#2F7D73", soft: "#E7F1EE" },
        icons: {
          사회이슈: "users-round",
          교육: "graduation-cap",
          "인구·세대": "users",
          "문화·생활": "sparkles",
        },
      },
      "정치·정책": {
        palette: { primary: "#5D4E86", secondary: "#5D4E86", soft: "#EEEAF5" },
        icons: {
          정치: "landmark",
          정책: "file-text",
          선거: "vote",
          "여론·쟁점": "messages-square",
        },
      },
      "민생·경제": {
        palette: { primary: "#9A7425", secondary: "#9A7425", soft: "#F5EFD9" },
        icons: {
          민생: "wallet",
          "노동·고용": "briefcase",
          "복지·지원": "hand-heart",
          생활경제: "receipt",
        },
      },
      "법·제도": {
        palette: { primary: "#813F4A", secondary: "#813F4A", soft: "#F4E8EA" },
        icons: {
          "사건·수사": "search",
          "재판·판결": "gavel",
          "법률·제도": "scale",
          "권리·분쟁": "shield-check",
        },
      },
      "국제·정세": {
        palette: { primary: "#356A92", secondary: "#356A92", soft: "#E7EEF4" },
        icons: {
          국제정치: "globe-2",
          "전쟁·안보": "shield",
          국제경제: "chart-no-axes-combined",
          해외이슈: "earth",
        },
      },
      스포츠: {
        palette: { primary: "#C45A2A", secondary: "#C45A2A", soft: "#F7E9E2" },
        icons: {
          축구: "football",
          야구: "baseball",
          농구: "basketball",
          E스포츠: "gamepad-2",
          기타스포츠: "medal",
        },
      },
      "연예·콘텐츠": {
        palette: { primary: "#9B5C7C", secondary: "#9B5C7C", soft: "#F4EAF0" },
        icons: {
          연예이슈: "newspaper",
          "방송·OTT": "tv",
          "영화·공연": "clapperboard",
          "K팝·음악": "music-2",
        },
      },
    },
    roleIcons: SERIES_ROLE_ICONS,
  },
};

export function outputTheme(value: string): OutputTheme {
  return isContentTheme(value) ? value : "misc";
}

export function isContentTheme(value: string): value is ContentTheme {
  return CONTENT_THEME_NAMES.includes(value as ContentTheme);
}

export function themeDefinition(value: string): ThemeDefinition {
  return THEMES[outputTheme(value)];
}

export function isSeriesTheme(value: string): value is SeriesThemeName {
  return SERIES_THEME_NAMES.includes(value as SeriesThemeName);
}

export function seriesThemeDefinition(value: SeriesThemeName): SeriesThemeDefinition {
  return SERIES_THEMES[value];
}

export function seriesThemeIconNames(value: SeriesThemeName): SupportedIcon[] {
  const theme = seriesThemeDefinition(value);
  const categoryIcons = Object.values(theme.categories).flatMap((category) => Object.values(category.icons));
  return [...new Set([...categoryIcons, ...Object.values(theme.roleIcons)])];
}

export function seriesThemeLargeCategories(value: SeriesThemeName): string[] {
  return Object.keys(seriesThemeDefinition(value).categories);
}

export function seriesThemeSmallCategories(value: SeriesThemeName, largeCategory: string): string[] {
  const category = seriesThemeDefinition(value).categories[largeCategory];
  return category ? Object.keys(category.icons) : [];
}

export function seriesThemeCategoryIcon(
  value: SeriesThemeName,
  largeCategory: string,
  smallCategory: string,
): SupportedIcon | undefined {
  return seriesThemeDefinition(value).categories[largeCategory]?.icons[smallCategory];
}

export function seriesThemeCategoryPalette(
  value: SeriesThemeName,
  largeCategory: string,
): SeriesCategoryPalette | undefined {
  return seriesThemeDefinition(value).categories[largeCategory]?.palette;
}
