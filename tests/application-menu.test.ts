import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/application-menu.ts"), "utf8");
const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("native application menu wiring", () => {
  it.each(["File", "Edit", "Insert", "View", "Help"])("defines the %s menu", (name) => {
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
    expect(source).toContain('id: "insert-table"');
    expect(source).toContain("action: actions.showTableBuilder");
  });

  it("opens an accessible About dialog with backdrop dismissal", () => {
    expect(html).toContain('id="about-dialog"');
    expect(html).toContain('aria-labelledby="about-title"');
    expect(html).toContain('<form method="dialog">');
    expect(main).toContain("aboutDialog?.showModal()");
    expect(main).toContain("if (event.target === aboutDialog) aboutDialog.close()");
  });

  it("offers the Table Builder from the toolbar and Insert menu only in the main window", () => {
    expect(html).toContain('id="table-builder"');
    expect(html).toContain('id="table-dialog"');
    expect(html).toContain('aria-labelledby="table-dialog-title"');
    expect(html).toContain('id="table-reset"');
    expect(main).toContain("tableBuilderButton?.addEventListener(\"click\", showTableBuilder)");
    expect(main).toContain('tableDialog?.addEventListener("cancel", (event) => event.preventDefault())');
    expect(main).toContain('header.placeholder = `Column ${index + 1}`');
    expect(main).toContain("tableReset?.addEventListener(\"click\", resetTableBuilder)");
    expect(main).toContain('table.className = "table-dialog__configuration"');
    expect(main).toContain('radio.type = "radio"');
    expect(main).toContain("button.dataset.tableSetAll = alignment");
    expect(main).toContain('button.textContent = "Set"');
    expect(main).toContain("button.ariaLabel = label");
    expect(main).toContain("button.title = label");
    expect(main).toContain("radio.checked = true");
    expect(main).toContain("insertMarkdownTable(");
    expect(css).toMatch(/\.table-dialog__columns\s*\{[^}]*max-height: clamp\(16rem, 50vh, 32rem\)/s);
    expect(css).toContain(".table-dialog__header-column { width: 46%; }");
    expect(css).toContain(".table-dialog__alignment-column { width: 18%; }");
    expect(readFileSync(resolve(process.cwd(), "reference.html"), "utf8")).not.toContain('id="table-builder"');
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

  it("keeps Recent Files as a stable submenu in empty and populated states", () => {
    expect(source).toContain('Submenu.new({ text: "Recent Files", items: [] })');
    expect(source).toContain('MenuItem.new({ text: "No Recent Files", enabled: false })');
    expect(source).not.toContain("recentMenu.setEnabled");
    expect(source).toContain("activateMenuForFocusedWindow(menu)");
  });

  it("constructs dynamic recent entries as actionable menu resources before appending them", () => {
    expect(source).toContain("let recentItems: MenuItem[] = []");
    expect(source).toContain("MenuItem.new({");
    expect(source).toContain("action: () => actions.openRecent(path)");
    expect(source).toContain("recentMenu.append(recentItems)");
    expect(source).toContain("recentMenu.remove(item)");
    expect(source).toContain("item.close()");
    expect(source).not.toContain("for (const item of await recentMenu.items())");
  });

  it("keeps only frequent actions on the toolbar", () => {
    for (const id of ["new-document", "open-document", "save-document", "save-document-as", "table-builder", "view-mode", "swap-panes"]) {
      expect(html).toContain(`id="${id}"`);
    }
    for (const id of ["clear-document", "load-readme", "print-preview"]) {
      expect(html).not.toContain(`id="${id}"`);
    }
  });
});
