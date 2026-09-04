import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("document status wiring", () => {
  it("routes main-window status rendering through the full-path formatter", () => {
    const main = readFileSync("src/main.ts", "utf8");

    expect(main).toContain('import { formatDocumentStatus } from "./document-status"');
    expect(main).toContain("documentStatus.textContent = formatDocumentStatus(documentSnapshot)");
  });

  it("allows long paths to wrap without displacing operation feedback", () => {
    const styles = readFileSync("src/styles.css", "utf8");

    expect(styles).toMatch(/\.document-status\s*{[^}]*flex:\s*1 1 auto;/s);
    expect(styles).toMatch(/\.document-status\s*{[^}]*min-width:\s*0;/s);
    expect(styles).toMatch(/\.document-status\s*{[^}]*overflow-wrap:\s*anywhere;/s);
    expect(styles).toMatch(/\.operation-feedback\s*{[^}]*flex-shrink:\s*0;/s);
  });
});
