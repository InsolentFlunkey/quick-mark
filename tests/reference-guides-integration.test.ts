import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import "../shared/markdown-renderer.js";
import "../shared/editor-behavior.js";

const mocks = vi.hoisted(() => ({
  openUrl: vi.fn().mockResolvedValue(undefined),
  resolve: vi.fn(), readImage: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: mocks.openUrl }));
vi.mock("../src/tauri-file-services", () => ({
  tauriFileServices: {}, resolveDocumentLink: mocks.resolve, readLocalImage: mocks.readImage,
}));
vi.mock("../src/reference-menu", () => ({ createReferenceMenu: vi.fn().mockResolvedValue({
  setView: vi.fn(), setSyncScrolling: vi.fn(), activate: vi.fn(),
}) }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({
  onFocusChanged: vi.fn(), onCloseRequested: vi.fn(), close: vi.fn(),
}) }));

it("renders real bundled guides in the README window, focuses headings and retains the read-only boundary", async () => {
  document.body.innerHTML = readFileSync("reference.html", "utf8");
  await import("../src/reference");
  const preview = document.querySelector<HTMLElement>("#reference-preview")!;
  const back = document.querySelector<HTMLButtonElement>("#guide-back")!;
  expect(document.querySelector<HTMLElement>("#guide-navigation")!.hidden).toBe(false);
  expect(back.disabled).toBe(true);
  expect(preview.querySelector("h1")?.textContent).toBe("QuickMark");
  preview.scrollTop = 300;
  preview.querySelector<HTMLAnchorElement>('a[href="docs/editing.md"]')!.click();
  expect(preview.querySelector("h1")?.textContent).toBe("Editing and managing documents");
  expect(document.activeElement).toBe(preview.querySelector("h1"));
  expect(preview.scrollTop).toBe(0);
  expect(document.title).toBe("Editing and managing documents — QuickMark");
  expect(document.querySelector<HTMLElement>("#reference-editor-panel")!.hidden).toBe(true);
  expect(document.querySelector<HTMLElement>("#example-actions")!.hidden).toBe(true);
  expect(back.disabled).toBe(false);
  preview.scrollTop = 650;
  preview.scrollLeft = 12;
  preview.querySelector<HTMLAnchorElement>('a[href="linting.md"]')!.click();
  expect(preview.querySelector("h1")?.textContent).toBe("Markdown linting");
  back.click();
  expect(preview.querySelector("h1")?.textContent).toBe("Editing and managing documents");
  expect(preview.scrollTop).toBe(650);
  expect(preview.scrollLeft).toBe(12);
  expect(document.activeElement).toBe(preview);
  back.click();
  expect(preview.querySelector("h1")?.textContent).toBe("QuickMark");
  expect(preview.scrollTop).toBe(300);
  expect(back.disabled).toBe(true);
  back.click();
  expect(preview.scrollTop).toBe(300);
  preview.querySelector<HTMLAnchorElement>('a[href="docs/linting.md"]')!.click();
  expect(preview.querySelector<HTMLAnchorElement>('a[href="../README.md"]')!.textContent).toBe("README");
  preview.querySelector<HTMLAnchorElement>('a[href="../README.md"]')!.click();
  expect(preview.querySelector("h1")?.textContent).toBe("QuickMark");
  expect(document.title).toBe("README — QuickMark");
  preview.querySelector<HTMLAnchorElement>('a[href="docs/build-windows.md"]')!.click();
  expect(preview.querySelectorAll(".copy-btn").length).toBeGreaterThan(0);
  preview.querySelector<HTMLAnchorElement>('a[href="https://rustup.rs/"]')!.click();
  expect(mocks.openUrl).toHaveBeenCalledWith("https://rustup.rs/");
  expect(preview.querySelector("h1")?.textContent).toBe("Building on Windows");
  expect(mocks.resolve).not.toHaveBeenCalled();
  expect(mocks.readImage).not.toHaveBeenCalled();
  expect(document.querySelector("#reference-status")?.textContent).toBe("");
  // Neither external links nor rejected bundle paths add a history entry.
  const invalid = document.createElement("a");
  invalid.setAttribute("href", "missing.md");
  preview.append(invalid);
  invalid.click();
  expect(document.querySelector("#reference-status")?.textContent).toContain("not a bundled guide");
  back.click();
  expect(preview.querySelector("h1")?.textContent).toBe("QuickMark");
  back.click();
  expect(preview.querySelector("h1")?.textContent).toBe("Markdown linting");
  back.click();
  expect(preview.querySelector("h1")?.textContent).toBe("QuickMark");
  expect(back.disabled).toBe(true);
});
