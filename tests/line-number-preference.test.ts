import { describe, expect, it, vi } from "vitest";
import {
  LINE_NUMBERS_KEY,
  loadLineNumbersPreference,
  saveLineNumbersPreference,
} from "../src/line-number-preference";

describe("line-number preference", () => {
  it("defaults to visible and only an explicit false hides the gutter", () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    expect(loadLineNumbersPreference(storage)).toBe(true);
    storage.getItem.mockReturnValue("false");
    expect(loadLineNumbersPreference(storage)).toBe(false);
    storage.getItem.mockReturnValue("invalid");
    expect(loadLineNumbersPreference(storage)).toBe(true);
  });

  it("persists the visibility under a stable application key", () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn() };
    saveLineNumbersPreference(storage, false);
    expect(storage.setItem).toHaveBeenCalledWith(LINE_NUMBERS_KEY, "false");
  });
});
