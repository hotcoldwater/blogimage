import assert from "node:assert/strict";
import { parseSingleRenderInput, SingleInputValidationError } from "./singleInputSchema.js";

const valid = {
  schema_version: "1.0",
  task: "render_single",
  post_title: "테스트 원고",
  large_category: "투자",
  small_category: "인사이트",
  cover_title: ["수익보다 먼저", "뇌가 망가진다"],
  subtitle: ["전망이론으로 보는", "투자 심리"],
};

assert.deepEqual(parseSingleRenderInput(valid).cover_title, valid.cover_title);

const invalidCases: Array<[string, unknown]> = [
  ["large_category", { ...valid, large_category: "미지원" }],
  ["small_category", { ...valid, small_category: "정보" }],
  ["cover_title", { ...valid, cover_title: ["한 줄", "두 줄", "세 줄"] }],
  ["subtitle", { ...valid, subtitle: [] }],
  ["task", { ...valid, task: "render_singe" }],
  ["schema_version", { ...valid, schema_version: "2.0" }],
  ["large_category", { ...valid, large_category: "머무름", small_category: "여행" }],
];

for (const [field, value] of invalidCases) {
  assert.throws(
    () => parseSingleRenderInput(value),
    (error) => error instanceof SingleInputValidationError && error.issues.some((issue) => issue.field === field),
  );
}

console.log(`Single-input schema tests passed (${invalidCases.length + 1} cases).`);
