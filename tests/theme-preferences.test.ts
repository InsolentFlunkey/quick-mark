import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  loadTheme,
  nativeThemeFor,
  saveTheme,
} from "../src/theme-preferences";

describe("theme preferences", () => {
  it("loads the default for missing or invalid values and persists supported themes", () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    expect(loadTheme(storage)).toBe(DEFAULT_THEME);
    storage.getItem.mockReturnValue("system");
    expect(loadTheme(storage)).toBe(DEFAULT_THEME);
    storage.getItem.mockReturnValue("classic");
    expect(loadTheme(storage)).toBe("classic");
    saveTheme(storage, "light");
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "light");
  });

  it("applies a stable DOM identity and maps Classic to a dark native surface", () => {
    applyTheme("classic");
    expect(document.documentElement.dataset.theme).toBe("classic");
    expect(nativeThemeFor("classic")).toBe("dark");
    expect(nativeThemeFor("dark")).toBe("dark");
    expect(nativeThemeFor("light")).toBe("light");
  });
});

function luminance(hex: string) {
  const channels = hex.match(/[0-9a-f]{2}/gi)!.map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(left: string, right: string) {
  const [bright, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
}

describe("theme presentation", () => {
  const css = readFileSync("src/styles.css", "utf8");
  const markdown = readFileSync("shared/markdown.css", "utf8");
  const block = (selector: string) => css.match(new RegExp(`${selector.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*\\{([^}]+)\\}`))![1];
  const value = (rules: string, name: string) => rules.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];

  it.each([[":root", "dark"], [':root[data-theme="light"]', "light"], [':root[data-theme="classic"]', "classic"]])
  ("keeps primary text and accents readable in the %s palette", (selector) => {
    const rules = block(selector);
    const background = value(rules, "background");
    expect(contrast(value(rules, "text"), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(rules, "accent"), background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([[":root", "dark"], [':root[data-theme="light"]', "light"], [':root[data-theme="classic"]', "classic"]])
  ("keeps completion text readable in the %s palette", (selector) => {
    const rules = block(selector);
    const background = value(rules, "completion-background");
    expect(contrast(value(rules, "completion-text"), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(rules, "completion-detail"), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(rules, "completion-selected-text"), value(rules, "completion-selected-background")))
      .toBeGreaterThanOrEqual(4.5);
  });

  it("overrides CodeMirror completion surfaces and interaction states with theme colors", () => {
    expect(css).toContain(".cm-tooltip.cm-tooltip-autocomplete");
    expect(css).toContain("scrollbar-color: var(--completion-detail) var(--completion-background)");
    expect(css).toContain("li:not([aria-selected]):hover");
    expect(css).toContain("li[aria-selected] .cm-completionDetail");
  });

  it("defines keyboard states and an explicit theme-independent print palette", () => {
    expect(css).toContain("select:focus-visible");
    expect(css).toContain("summary:focus-visible");
    expect(css).toMatch(/@media print[\s\S]*color: #000;[\s\S]*background: white;/);
    expect(markdown).toMatch(/@media print[\s\S]*\.viewer \{ padding: 0; color: #000; \}/);
  });

  it("retains the recovered original QuickMark palette as Classic", () => {
    const classic = block(':root[data-theme="classic"]');
    for (const original of ["#0b1020", "#e5e7eb", "#94a3b8", "#60a5fa", "#0a0f1f", "rgb(15 23 42"]) {
      expect(classic).toContain(original);
    }
    expect(classic).toContain("radial-gradient");
  });

  it("wires shared preference updates into editor and reference windows", () => {
    const main = readFileSync("src/main.ts", "utf8");
    const reference = readFileSync("src/reference.ts", "utf8");
    const capability = readFileSync("src-tauri/capabilities/default.json", "utf8");
    for (const source of [main, reference]) {
      expect(source).toContain("THEME_STORAGE_KEY");
      expect(source).toContain("setTheme(nativeThemeFor(");
      expect(source).toContain('addEventListener("storage"');
    }
    expect(main).toContain('querySelector<HTMLSelectElement>("#theme-selector")');
    expect(main).toContain("refreshThemeControls()");
    expect(main).toContain("await selectTheme(themeSelect.value)");
    expect(capability).toContain('"core:window:allow-set-theme"');
  });
});
