import type { ContentTheme } from "./themes.js";

interface CategoryDefinition {
  theme: ContentTheme;
  icons: Record<string, string>;
}

export const CATEGORY_MAPPINGS = {
  투자: {
    theme: "investment",
    icons: {
      투자기초: "lightbulb",
      인사이트: "brain",
      투자전략: "compass",
      기업분석: "file-search",
      매크로분석: "globe-2",
      센티먼트분석: "gauge",
      기술적분석: "chart-candlestick",
    },
  },
  CPA: {
    theme: "cpa",
    icons: {
      꿀팁: "calculator",
      수험자료: "book-open",
      정보: "file-search",
    },
  },
  IT: {
    theme: "it",
    icons: {
      AI뉴스: "newspaper",
      AI활용: "workflow",
      프로젝트: "folder-kanban",
    },
  },
  스포츠: {
    theme: "sports",
    icons: {
      농구: "basketball",
      축구: "football",
    },
  },
  남수단: {
    theme: "south-sudan",
    icons: {
      도감: "map",
    },
  },
  기록: {
    theme: "record",
    icons: {
      일상: "notebook-pen",
      건강: "heart-pulse",
      이슈: "newspaper",
      독서: "book-open",
      생각: "brain",
    },
  },
} as const satisfies Record<string, CategoryDefinition>;

export type SupportedLargeCategory = keyof typeof CATEGORY_MAPPINGS;

export function isSupportedLargeCategory(value: string): value is SupportedLargeCategory {
  return Object.hasOwn(CATEGORY_MAPPINGS, value);
}

export function allowedSmallCategories(largeCategory: SupportedLargeCategory): string[] {
  return Object.keys(CATEGORY_MAPPINGS[largeCategory].icons);
}

export function categoryTheme(largeCategory: SupportedLargeCategory): ContentTheme {
  return CATEGORY_MAPPINGS[largeCategory].theme;
}

export function categoryIcon(largeCategory: SupportedLargeCategory, smallCategory: string): string | undefined {
  const icons = CATEGORY_MAPPINGS[largeCategory].icons as Record<string, string>;
  return icons[smallCategory];
}
