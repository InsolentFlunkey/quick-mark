import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import {
  extractSourceAnchors,
  interpolateMapping,
  maximumMappingError,
  normalizeMappingPoints,
  proportionalMapping,
} from "../research/scroll-sync-prototype";

describe("scroll synchronization research prototype", () => {
  it("finds mapped anchors for representative Markdown block types", () => {
    const parser = new MarkdownIt();
    const source = [
      "# Heading", "", "> Quote", "", "- one", "- two", "", "| A | B |", "| - | - |", "| 1 | 2 |", "",
      "```js", "console.log('code')", "```", "", "![image](https://example.com/image.png)",
    ].join("\n");
    const types = new Set(extractSourceAnchors(parser, source).map((anchor) => anchor.type));
    for (const type of ["heading_open", "blockquote_open", "bullet_list_open", "table_open", "fence", "paragraph_open"]) {
      expect(types).toContain(type);
    }
  });

  it("covers the existing large mixed fixtures with monotonic source anchors", () => {
    const parser = new MarkdownIt();
    for (const file of ["test-files/kitchen-sink.md", "src/markdown-examples.md"]) {
      const markdown = readFileSync(resolve(process.cwd(), file), "utf8");
      const anchors = extractSourceAnchors(parser, markdown);
      expect(anchors.length).toBeGreaterThan(15);
      expect(anchors.every((anchor, index) => index === 0 || anchor.startLine > anchors[index - 1].startLine)).toBe(true);
    }
  });

  it("shows local anchors outperforming whole-document percentages when block heights diverge", () => {
    const truth = [
      { source: 0, target: 0 },
      { source: 20, target: 80 },
      { source: 40, target: 520 },
      { source: 60, target: 600 },
      { source: 80, target: 920 },
      { source: 100, target: 1000 },
    ];
    const proportionalError = maximumMappingError((position) => proportionalMapping(position, 100, 1000), truth);
    const hybridError = maximumMappingError((position) => interpolateMapping(truth, position), truth);
    expect(proportionalError).toBe(120);
    expect(hybridError).toBe(0);
  });

  it("interpolates between measured blocks and adapts when an image changes layout", () => {
    const beforeImage = [{ source: 0, target: 0 }, { source: 50, target: 300 }, { source: 100, target: 700 }];
    const afterImage = [{ source: 0, target: 0 }, { source: 50, target: 300 }, { source: 100, target: 1100 }];
    expect(interpolateMapping(beforeImage, 75)).toBe(500);
    expect(interpolateMapping(afterImage, 75)).toBe(700);
  });

  it("sanitizes duplicate and non-monotonic measurements before binary-search interpolation", () => {
    expect(normalizeMappingPoints([
      { source: 10, target: 100 }, { source: 0, target: 0 }, { source: 10, target: 90 },
      { source: 20, target: 80 }, { source: Number.NaN, target: 200 },
    ])).toEqual([{ source: 0, target: 0 }, { source: 10, target: 100 }, { source: 20, target: 100 }]);
    expect(interpolateMapping([{ source: 0, target: 0 }, { source: 20, target: 100 }], 5)).toBe(25);
  });

  it("keeps a large sparse-anchor document monotonic and exact at measured blocks", () => {
    const points = Array.from({ length: 5_000 }, (_, index) => ({
      source: index * 8,
      target: index * 13 + (index > 2_500 ? 900 : 0),
    }));
    const normalized = normalizeMappingPoints(points);
    expect(normalized).toHaveLength(5_000);
    expect(normalized.every((point, index) => index === 0 || point.target >= normalized[index - 1].target)).toBe(true);
    expect(interpolateMapping(normalized, points[3_750].source)).toBe(points[3_750].target);
  });
});
