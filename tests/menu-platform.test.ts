import { describe, expect, it, vi } from "vitest";
import type { Menu } from "@tauri-apps/api/menu";
import { activateMenuForFocusedWindow, isMacPlatform } from "../src/menu-platform";

describe("menu platform selection", () => {
  it.each(["MacIntel", "macOS", "MacPPC"])("recognizes %s as macOS", (platform) => {
    expect(isMacPlatform(platform)).toBe(true);
  });

  it.each(["Linux x86_64", "Win32", "Windows"])("keeps %s menus window-local", (platform) => {
    expect(isMacPlatform(platform)).toBe(false);
  });

  it("reactivates only the app-wide macOS menu when a window receives focus", async () => {
    const setAsAppMenu = vi.fn().mockResolvedValue(null);
    const menu = { setAsAppMenu } as unknown as Menu;

    await activateMenuForFocusedWindow(menu, "Linux x86_64");
    await activateMenuForFocusedWindow(menu, "Win32");
    expect(setAsAppMenu).not.toHaveBeenCalled();

    await activateMenuForFocusedWindow(menu, "MacIntel");
    expect(setAsAppMenu).toHaveBeenCalledOnce();
  });
});
