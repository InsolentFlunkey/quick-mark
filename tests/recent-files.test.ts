import { describe, expect, it, vi } from "vitest";
import {
  addRecentFile,
  loadRecentFiles,
  MAX_RECENT_FILES,
  recentFileLabel,
  RECENT_FILES_KEY,
  removeRecentFile,
  saveRecentFiles,
} from "../src/recent-files";

describe("recent files", () => {
  it("loads only unique non-empty paths and tolerates corrupt storage", () => {
    const storage = { getItem: vi.fn().mockReturnValue("not json"), setItem: vi.fn() };
    expect(loadRecentFiles(storage)).toEqual([]);
    storage.getItem.mockReturnValue(JSON.stringify(["/one.md", "", 2, "/one.md", "/two.md"]));
    expect(loadRecentFiles(storage)).toEqual(["/one.md", "/two.md"]);
  });

  it("moves reopened paths first and caps the list", () => {
    const paths = Array.from({ length: MAX_RECENT_FILES }, (_, index) => `/doc-${index}.md`);
    expect(addRecentFile(paths, "/doc-5.md")).toEqual(["/doc-5.md", ...paths.filter((path) => path !== "/doc-5.md")]);
    expect(addRecentFile(paths, "/new.md")).toEqual(["/new.md", ...paths.slice(0, -1)]);
  });

  it("removes stale paths and saves only normalized path data", () => {
    expect(removeRecentFile(["/one.md", "/two.md"], "/one.md")).toEqual(["/two.md"]);
    const storage = { getItem: vi.fn(), setItem: vi.fn() };
    saveRecentFiles(storage, ["/one.md", "/one.md", "/two.md"]);
    expect(storage.setItem).toHaveBeenCalledWith(RECENT_FILES_KEY, JSON.stringify(["/one.md", "/two.md"]));
  });

  it("derives labels from Windows and POSIX paths", () => {
    expect(recentFileLabel("C:\\notes\\one.md")).toBe("one.md");
    expect(recentFileLabel("/notes/two.md")).toBe("two.md");
  });
});
