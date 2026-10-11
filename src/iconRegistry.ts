import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./utils.js";

export const SUPPORTED_ICONS = [
  "lightbulb",
  "brain",
  "compass",
  "file-search",
  "calculator",
  "book-open",
  "globe-2",
  "gauge",
  "chart-candlestick",
  "newspaper",
  "workflow",
  "folder-kanban",
  "basketball",
  "baseball",
  "football",
  "users-round",
  "graduation-cap",
  "users",
  "sparkles",
  "landmark",
  "file-text",
  "vote",
  "messages-square",
  "wallet",
  "hand-heart",
  "receipt",
  "search",
  "gavel",
  "shield",
  "chart-no-axes-combined",
  "earth",
  "gamepad-2",
  "medal",
  "map",
  "notebook-pen",
  "heart-pulse",
  "message-circle",
  "shield-check",
  "clipboard-check",
  "archive",
  "list-checks",
  "key-round",
  "arrow-left-right",
  "list-ordered",
  "arrow-right",
  "scale",
  "circle-dot",
  "triangle-alert",
  "circle-check",
  "chart-line",
  "building-2",
  "target",
  "house",
  "map-pin",
  "building",
  "briefcase",
  "code-2",
  "blocks",
  "tv",
  "clapperboard",
  "music-2",
] as const;

export type SupportedIcon = (typeof SUPPORTED_ICONS)[number];

export function isSupportedIcon(value: string): value is SupportedIcon {
  return SUPPORTED_ICONS.includes(value as SupportedIcon);
}

export function getIconSvg(iconName: string): string | null {
  if (!isSupportedIcon(iconName)) return null;
  return fs.readFileSync(path.join(PROJECT_ROOT, "assets", "icons", `${iconName}.svg`), "utf8");
}
