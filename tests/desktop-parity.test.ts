import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("desktop parity surface", () => {
  const html = source("index.html");
  const main = source("src/main.ts");
  const css = source("src/styles.css");

  it("offers document and persisted view actions", () => {
    for (const id of [
      "new-document",
      "open-document",
      "save-document",
      "save-document-as",
      "view-mode",
      "swap-panes",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(main).toMatch(/try\s*\{\s*viewPreferences = loadViewPreferences\(localStorage\)/);
    expect(main).toContain("saveViewPreferences(localStorage, next)");
  });

  it("uses the full window width and keeps branding out of the toolbar", () => {
    expect(html).not.toContain('class="brand"');
    expect(main).toContain("QuickMark — Write Markdown. See it rendered.");
    expect(css).toMatch(/\.app-shell\s*\{[^}]*width: 100%;/s);
    expect(css).not.toMatch(/\.app-shell\s*\{[^}]*width: min\(/s);
  });

  it("gives the native view selector readable dark-theme colors", () => {
    expect(css).toContain("color-scheme: dark");
    expect(css).toMatch(/select option\s*\{[^}]*color: var\(--text\);[^}]*background: var\(--panel\);/s);
  });

  it("loads dropped files through the guarded document path", () => {
    expect(main).toContain("listenForFileDrops");
    expect(main).toContain('runProtectedOperation("Open dropped file"');
    expect(main).toContain("openDocument(documentLifecycle, tauriFileServices, path)");
  });

  it("fits panes within the desktop viewport and prints only rendered output", () => {
    expect(css).toMatch(/body\s*\{[^}]*height: 100vh;[^}]*overflow: hidden;/s);
    expect(css).toMatch(/\.app-shell\s*\{[^}]*grid-template-rows: auto minmax\(0, 1fr\)/s);
    expect(css).toMatch(/\.editor-panel,[\s\S]*?min-height: 0;/);
    expect(css).toMatch(/@media print[\s\S]*?\.editor-panel\s*\{\s*display: none !important;/);
    expect(css).toMatch(/@media print[\s\S]*?\.preview-panel\s*\{\s*display: block !important;/);
  });

  it("keeps focus-escape help accessible without reserving visible layout space", () => {
    expect(html).toContain('class="editor-help sr-only"');
    expect(html).toContain('title="Press Escape, then Tab to leave the editor."');
  });
});
