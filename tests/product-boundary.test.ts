import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("supported product boundary", () => {
  it("does not ship the retired browser application or launcher", () => {
    expect(existsSync(resolve(root, "QuickMark.html"))).toBe(false);
    expect(existsSync(resolve(root, "Start-QuickMark.ps1"))).toBe(false);
  });

  it("documents the Tauri desktop app as the supported product", () => {
    const readme = readFileSync(resolve(root, "README.md"), "utf8");
    const roadmap = readFileSync(resolve(root, "ROADMAP.md"), "utf8");

    expect(readme).toContain("cross-platform Markdown viewer and editor built with Tauri");
    expect(readme).not.toMatch(/QuickMark\.html|Start-QuickMark|vendor\/readme|vendor\/launch/);
    expect(roadmap).toContain("cross-platform QuickMark desktop application");
    expect(roadmap).not.toMatch(/QuickMark\.html|Start-QuickMark|vendor\/readme|File System Access API/);
  });
});
