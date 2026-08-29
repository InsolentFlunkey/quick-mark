import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_VIEW_PREFERENCES,
  loadViewPreferences,
  saveViewPreferences,
  VIEW_MODE_KEY,
  VIEW_SWAPPED_KEY,
  SYNC_SCROLLING_KEY,
  loadSyncScrollingPreference,
  saveSyncScrollingPreference,
} from "../src/view-preferences";

describe("desktop view preferences", () => {
  it("uses split, unswapped defaults for missing or invalid values", () => {
    const storage = { getItem: vi.fn((key: string) => (key === VIEW_MODE_KEY ? "invalid" : null)), setItem: vi.fn() };
    expect(loadViewPreferences(storage)).toEqual(DEFAULT_VIEW_PREFERENCES);
  });

  it.each(["both", "input", "preview"] as const)("loads and saves the %s view", (mode) => {
    const values = new Map([
      [VIEW_MODE_KEY, mode],
      [VIEW_SWAPPED_KEY, "true"],
      [SYNC_SCROLLING_KEY, "false"],
    ]);
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    };
    expect(loadViewPreferences(storage)).toEqual({ mode, swapped: true, syncScrolling: false });

    saveViewPreferences(storage, { mode, swapped: false, syncScrolling: true });
    expect(values.get(VIEW_MODE_KEY)).toBe(mode);
    expect(values.get(VIEW_SWAPPED_KEY)).toBe("false");
    expect(values.get(SYNC_SCROLLING_KEY)).toBe("true");
  });

  it("shares an on-by-default sync preference without loading other view state", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    };
    expect(loadSyncScrollingPreference(storage)).toBe(true);
    saveSyncScrollingPreference(storage, false);
    expect(loadSyncScrollingPreference(storage)).toBe(false);
  });
});
