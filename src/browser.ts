import fs from "node:fs";
import { chromium, type Browser } from "playwright";

function installedBrowserPath(): string | undefined {
  const candidates = process.platform === "darwin"
    ? [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      ]
    : process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

export async function launchRendererBrowser(): Promise<Browser> {
  const systemBrowser = installedBrowserPath();
  return chromium.launch({
    headless: true,
    ...(systemBrowser ? { executablePath: systemBrowser } : {}),
  });
}
