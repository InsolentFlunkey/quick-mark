import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/application-menu.ts"), "utf8");
const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

describe("native application menu wiring", () => {
  it.each(["File", "Edit", "View", "Help"])("defines the %s menu", (name) => {
    expect(source).toContain(`text: "${name}"`);
  });

  it("provides file, native edit, view, reference placeholder, and About commands", () => {
    for (const id of ["file-new", "file-open", "file-save", "file-save-as", "file-print", "file-close", "edit-clear"]) {
      expect(source).toContain(`id: "${id}"`);
    }
    for (const item of ["Undo", "Redo", "Cut", "Copy", "Paste", "SelectAll"]) {
      expect(source).toContain(`item: "${item}"`);
    }
    expect(source).toContain('text: "README"');
    expect(source).toContain('text: "Markdown Examples"');
    expect(source).toContain('id: "help-about"');
    expect(source).toContain("action: actions.showAbout");
  });

  it("opens an accessible About dialog with backdrop dismissal", () => {
    expect(html).toContain('id="about-dialog"');
    expect(html).toContain('aria-labelledby="about-title"');
    expect(html).toContain('<form method="dialog">');
    expect(main).toContain("aboutDialog?.showModal()");
    expect(main).toContain("if (event.target === aboutDialog) aboutDialog.close()");
  });

  it("synchronizes view checks and routes recent files through guarded opening", () => {
    expect(source).toContain("splitView.setChecked(mode === \"both\")");
    expect(source).toContain("swap.setEnabled(mode === \"both\")");
    expect(source).toContain("save.setEnabled(canSave)");
    expect(source).toContain("saveAs.setEnabled(canSaveAs)");
    expect(main).toContain('runProtectedOperation("Open recent file"');
    expect(main).toContain("removeRecentFile(recentFiles, path)");
    expect(source).toContain('id: "view-sync-scrolling"');
    expect(source).toContain('text: "Sync Scrolling"');
    expect(source).toContain('syncScrolling.setEnabled(mode === "both")');
    expect(main).toContain("syncScrolling: enabled");
  });

  it("keeps only frequent actions on the toolbar", () => {
    for (const id of ["new-document", "open-document", "save-document", "save-document-as", "view-mode", "swap-panes"]) {
      expect(html).toContain(`id="${id}"`);
    }
    for (const id of ["clear-document", "load-readme", "print-preview"]) {
      expect(html).not.toContain(`id="${id}"`);
    }
  });
});
