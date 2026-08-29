import { describe, expect, it } from "vitest";
import { escapeTableCell, generateMarkdownTable, insertMarkdownTable } from "../src/table-builder";

describe("Markdown table generation", () => {
  it("generates headers, alignment delimiters, and blank body rows", () => {
    expect(generateMarkdownTable({
      headers: ["Name", "Meaning", "Count"],
      alignments: ["left", "center", "right"],
      bodyRows: 2,
    }).markdown).toBe([
      "| Name | Meaning | Count |",
      "| :--- | :---: | ---: |",
      "|  |  |  |",
      "|  |  |  |",
    ].join("\n"));
  });

  it("escapes cell pipes, backslashes, and line breaks", () => {
    expect(escapeTableCell("A | B\\C\nD")).toBe("A \\| B\\\\C D");
  });

  it("keeps blank header fields blank rather than applying suggestion text", () => {
    expect(generateMarkdownTable({ headers: ["", "Named"], alignments: ["left", "left"], bodyRows: 1 }).markdown)
      .toMatch(/^\|  \| Named \|/);
  });

  it("rejects invalid dimensions and missing alignments", () => {
    expect(() => generateMarkdownTable({ headers: [], alignments: [], bodyRows: 1 })).toThrow("between 1 and 20");
    expect(() => generateMarkdownTable({ headers: ["A"], alignments: ["left"], bodyRows: 0 })).toThrow(
      "between 1 and 100",
    );
    expect(() => generateMarkdownTable({ headers: ["A", "B"], alignments: ["left"], bodyRows: 1 })).toThrow(
      "Each column",
    );
  });
});

describe("Markdown table insertion", () => {
  const table = generateMarkdownTable({ headers: ["A", "B"], alignments: ["left", "right"], bodyRows: 1 });

  it("inserts at the cursor with block-separating newlines", () => {
    const result = insertMarkdownTable("BeforeAfter", 6, 6, table);
    expect(result.content).toBe(`Before\n\n${table.markdown}\n\nAfter`);
    expect(result.content.slice(result.caret, result.caret + 3)).toBe(" | ");
  });

  it("replaces only the selected text and preserves existing blank lines", () => {
    const result = insertMarkdownTable("Before\n\nreplace me\n\nAfter", 8, 18, table);
    expect(result.content).toBe(`Before\n\n${table.markdown}\n\nAfter`);
  });

  it("supports insertion into an empty document", () => {
    const result = insertMarkdownTable("", 0, 0, table);
    expect(result.content).toBe(table.markdown);
    expect(result.caret).toBe(table.firstBodyCellOffset);
  });
});
