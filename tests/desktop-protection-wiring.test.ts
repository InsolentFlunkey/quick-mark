import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const readProjectFile = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");

describe("desktop unsaved-change protection wiring", () => {
  it("preserves tabs on opening and checks all dirty tabs on window close", () => {
    const main = readProjectFile("src/main.ts");
    expect(main).toContain("tabSession.newDocument()");
    expect(main).toContain("tabSession.open(path)");
    expect(main).toContain("onCloseRequested");
    expect(main).toContain("tabSession.closeWindow(destroyCurrentWindow)");
    expect(main).toContain("destroyCurrentWindow");
  });

  it("exposes New and save controls and installs standard save shortcuts", () => {
    const html = readProjectFile("index.html");
    const main = readProjectFile("src/main.ts");
    expect(html).toContain('id="new-document"');
    expect(html).toContain('id="save-document"');
    expect(html).toContain('id="save-document-as"');
    expect(main).toContain("saveShortcutFor(event)");
    expect(main).toContain("event.preventDefault()");
  });

  it("grants only the additional native capabilities used by protection", () => {
    const capability = JSON.parse(readProjectFile("src-tauri/capabilities/default.json"));
    expect(capability.permissions).toContain("core:window:allow-destroy");
    expect(capability.permissions).toContain("dialog:allow-message");
  });
});
