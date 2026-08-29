import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appMetadataFromManifest } from "../build/app-metadata";
import { connectAbout, populateAbout, type AboutElements } from "../src/about-metadata";

function elements(): AboutElements {
  document.body.innerHTML = `
    <h2 id="title"></h2><p id="description"></p><span id="version"></span>
    <span id="publisher"></span><button id="repository"></button>
  `;
  return {
    title: document.querySelector("#title")!,
    description: document.querySelector("#description")!,
    version: document.querySelector("#version")!,
    publisher: document.querySelector("#publisher")!,
    repository: document.querySelector("#repository")!,
  };
}

const metadata = Object.freeze({
  name: "Example",
  version: "1.2.3",
  publisher: "Example Creator",
  homepage: "https://example.com/project",
  description: "Example description",
});
const aboutCapability = JSON.parse(
  readFileSync(resolve(process.cwd(), "src-tauri/capabilities/about.json"), "utf8"),
);
const rustEntry = readFileSync(resolve(process.cwd(), "src-tauri/src/lib.rs"), "utf8");

describe("About metadata", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("derives every displayed field from the Tauri manifest", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "src-tauri/tauri.conf.json"), "utf8"));
    expect(appMetadataFromManifest(manifest)).toEqual({
      name: manifest.productName,
      version: manifest.version,
      publisher: manifest.bundle.publisher,
      homepage: manifest.bundle.homepage,
      description: manifest.bundle.shortDescription,
    });
  });

  it("limits the registered opener plugin to the authoritative main-window URL", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "src-tauri/tauri.conf.json"), "utf8"));
    expect(rustEntry).toContain("tauri_plugin_opener::init()");
    expect(aboutCapability.windows).toEqual(["main"]);
    expect(aboutCapability.permissions).toEqual([
      {
        identifier: "opener:allow-open-url",
        allow: [{ url: manifest.bundle.homepage }],
      },
    ]);
  });

  it("rejects incomplete metadata and non-HTTPS homepages", () => {
    expect(() => appMetadataFromManifest({ bundle: {} })).toThrow(/productName/);
    expect(() => appMetadataFromManifest({
      productName: "Example", version: "1", bundle: { publisher: "Creator", homepage: "http://example.com", shortDescription: "Text" },
    })).toThrow(/HTTPS/);
  });

  it("renders accessible text and opens the authoritative repository", async () => {
    const target = elements();
    const openRepository = vi.fn().mockResolvedValue(undefined);
    connectAbout(target, { metadata, openRepository, reportError: vi.fn() });
    expect(target.title.textContent).toBe("About Example");
    expect(target.version.textContent).toBe("1.2.3");
    expect(target.publisher.textContent).toBe("Example Creator");
    expect(target.repository.textContent).toBe(metadata.homepage);
    target.repository.click();
    await vi.waitFor(() => expect(openRepository).toHaveBeenCalledWith(metadata.homepage));
  });

  it("reports opener failures without navigating the webview", async () => {
    const target = elements();
    const reportError = vi.fn();
    connectAbout(target, { metadata, openRepository: vi.fn().mockRejectedValue(new Error("blocked")), reportError });
    target.repository.click();
    await vi.waitFor(() => expect(reportError).toHaveBeenCalledWith(expect.stringContaining("blocked")));
  });

  it("can refresh rendered values without replacing controls", () => {
    const target = elements();
    populateAbout(target, { ...metadata, version: "2.0.0" });
    expect(target.version.textContent).toBe("2.0.0");
    expect(target.repository).toBe(document.querySelector("#repository"));
  });
});
