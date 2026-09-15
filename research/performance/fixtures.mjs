// Deterministic UTF-8 fixtures. No remote resources or filesystem links.
export function mixedFixture(bytes) {
  const blocks = []; let size = 0; let i = 0;
  while (size < bytes) {
    const block = `## Section ${i}\n\nCafé 中文 — Mixed **formatting**, a [section link](#section-${i}), and plain prose. ` +
      "A realistic paragraph wraps across several visual lines. ".repeat(8) +
      "\n\n- First item\n  - Nested item\n- Second item\n\n> A quoted paragraph with `inline code`.\n\n" +
      "| Name | Value |\n| --- | ---: |\n| Alpha | 12 |\n| Beta | 34 |\n\n```js\nconst value = 42;\n```\n\n";
    blocks.push(block); size += new TextEncoder().encode(block).length; i++;
  }
  return blocks.join("");
}
export const CASES = ["mixed-256k", "mixed-1m", "mixed-5m", "lines-50k", "wrapped-200k", "dense-table"];
export function fixture(name) {
  if (name === "mixed-256k") return mixedFixture(256 * 1024);
  if (name === "mixed-1m") return mixedFixture(1024 * 1024);
  if (name === "mixed-5m") return mixedFixture(5 * 1024 * 1024);
  if (name === "lines-50k") return "short line\n".repeat(50_000);
  if (name === "wrapped-200k") return "word ".repeat(40_000);
  if (name === "dense-table") return "# Dense table\n\n| Name | Value |\n| --- | --- |\n" +
    Array.from({ length: 10_000 }, (_, i) => `| Row ${i} | [missing](#missing-${i}) |\n`).join("");
  throw new Error(`Unknown benchmark fixture: ${name}`);
}
export function dimensions(source) {
  return { bytes: new TextEncoder().encode(source).length, characters: source.length,
    lines: source.split("\n").length };
}
export function summary(samples) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return { samples, median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    max: sorted.at(-1) };
}
