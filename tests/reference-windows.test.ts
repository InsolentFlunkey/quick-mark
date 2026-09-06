import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("non-destructive reference windows", () => {
  it("uses a separate multi-page entry and stable open-or-focus labels", () => {
    const service = source("src/reference-window-services.ts");
    expect(existsSync(resolve(root, "reference.html"))).toBe(true);
    expect(source("vite.config.ts")).toContain('reference: resolve(process.cwd(), "reference.html")');
    expect(service).toContain("WebviewWindow.getByLabel(kind)");
    expect(service).toContain("await existing.setFocus()");
    expect(service).toContain("new WebviewWindow(kind");
  });

  it("keeps README preview-only and Examples editable, resettable, and Save As-only", () => {
    const controller = source("src/reference.ts");
    expect(controller).toContain('kind === "examples" ? bundledExamples : bundledReadme');
    expect(controller).toContain('editorPanel.hidden = kind !== "examples"');
    expect(controller).toContain("lifecycle.edit(editor.value)");
    expect(controller).toContain("saveDocument(lifecycle, tauriFileServices, { saveAs: true })");
    expect(controller).toContain("lifecycle.loadBundledSample(baseline");
    expect(controller).toContain('resolveUnsavedChanges("Close"');
  });

  it("provides broad common Markdown examples", () => {
    const examples = source("src/markdown-examples.md");
    for (const syntax of ["**Bold**", "*italic*", "~~strikethrough~~", "> A blockquote", "- Unordered", "1. First", "[QuickMark repository]", "https://example.com", "| Feature |", "```js", "---"]) {
      expect(examples).toContain(syntax);
    }
  });

  it("grants named reference windows window-state and creation capabilities", () => {
    const baseline = source("src-tauri/capabilities/default.json");
    const desktop = source("src-tauri/capabilities/desktop.json");
    for (const label of ['"readme"', '"examples"']) {
      expect(baseline).toContain(label);
      expect(desktop).toContain(label);
    }
    expect(baseline).toContain("core:webview:allow-create-webview-window");
    expect(baseline).toContain("core:window:allow-close");
    expect(desktop).toContain("window-state:default");
  });

  it("keeps menus window-local off macOS and synchronizes exclusive example views", () => {
    const platform = source("src/menu-platform.ts");
    const referenceMenu = source("src/reference-menu.ts");
    const mainMenu = source("src/application-menu.ts");
    expect(platform).toContain("menu.setAsWindowMenu()");
    expect(platform).toContain("menu.setAsAppMenu()");
    expect(referenceMenu).toContain("modes[index].setChecked(candidate === mode)");
    expect(referenceMenu).toContain('id: "reference-sync-scrolling"');
    expect(referenceMenu).toContain('syncScrolling?.setEnabled(mode === "both")');
    expect(source("src/reference.ts")).toContain('kind === "examples"');
    expect(source("src/reference.ts")).toContain("createScrollSyncController");
    expect(mainMenu).not.toContain("Restore Pane Order");
    expect(referenceMenu).not.toContain("Restore Pane Order");
  });
});
