import { describe, expect, it } from "vitest";
import { isMacPlatform } from "../src/menu-platform";

describe("menu platform selection", () => {
  it.each(["MacIntel", "macOS", "MacPPC"])("recognizes %s as macOS", (platform) => {
    expect(isMacPlatform(platform)).toBe(true);
  });

  it.each(["Linux x86_64", "Win32", "Windows"])("keeps %s menus window-local", (platform) => {
    expect(isMacPlatform(platform)).toBe(false);
  });
});
