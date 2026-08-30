import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("rendered resource desktop wiring", () => {
  it("grants only supported rendered URL schemes to preview windows", () => {
    const capability = JSON.parse(source("src-tauri/capabilities/rendered-content.json"));
    expect(capability.windows).toEqual(["main", "readme", "examples"]);
    expect(capability.permissions).toEqual([
      {
        identifier: "opener:allow-open-url",
        allow: [{ url: "https://*" }, { url: "http://*" }, { url: "mailto:*" }],
      },
    ]);
    expect(source("src-tauri/tauri.conf.json")).not.toContain("assetProtocol");
  });

  it("installs the controller with lifecycle-aware dependencies in both previews", () => {
    const main = source("src/main.ts");
    const reference = source("src/reference.ts");
    for (const entry of [main, reference]) {
      expect(entry).toContain("installRenderedResourceController");
      expect(entry).toContain("getDocumentPath: () =>");
      expect(entry).toContain("openExternal: openUrl");
      expect(entry).toContain("readLocalImage");
      expect(entry).toContain("resolveDocumentLink");
    }
    expect(main).toContain('runProtectedOperation("Open relative document"');
  });

  it("registers narrow native commands without enabling arbitrary path opening", () => {
    const rust = source("src-tauri/src/lib.rs");
    const capabilities = [
      source("src-tauri/capabilities/default.json"),
      source("src-tauri/capabilities/desktop.json"),
      source("src-tauri/capabilities/rendered-content.json"),
    ].join("\n");
    expect(rust).toContain("resolve_document_link");
    expect(rust).toContain("read_local_image");
    expect(capabilities).not.toContain("opener:allow-open-path");
  });
});
