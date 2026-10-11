import fs from "node:fs";
import path from "node:path";

const MAX_FOLDER_LENGTH = 80;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

export function sanitizePostTitle(value: string): string {
  const normalized = value
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]+/g, " - ")
    .replace(/\s+/g, " ")
    .replace(/^[ .]+|[ .]+$/g, "");
  const sanitized = Array.from(normalized)
    .slice(0, MAX_FOLDER_LENGTH)
    .join("")
    .replace(/[ .]+$/g, "");
  if (/^-+$/.test(sanitized)) return "";
  return WINDOWS_RESERVED_NAME.test(sanitized) ? `_${sanitized}` : sanitized;
}

export function resolveSeriesOutputDirectory(outputRoot: string, postTitle: string): string {
  const folderName = sanitizePostTitle(postTitle);
  if (!folderName) {
    throw new Error("post_title을 파일시스템용으로 정제한 결과가 비었습니다. 문자·숫자·한글이 포함된 제목으로 수정하세요.");
  }
  const root = path.resolve(outputRoot);
  const target = path.resolve(root, folderName);
  if (path.dirname(target) !== root) throw new Error("정제된 출력 폴더가 output root 밖을 가리킵니다.");
  return target;
}

export function createSeriesTemporaryDirectory(outputRoot: string, folderName: string): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  return fs.mkdtempSync(path.join(outputRoot, `.${folderName}.tmp-`));
}
