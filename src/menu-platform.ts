import type { Menu } from "@tauri-apps/api/menu";

export function isMacPlatform(platform = navigator.userAgentData?.platform ?? navigator.platform) {
  return platform.toLowerCase().includes("mac");
}

export function attachWindowMenu(menu: Menu) {
  return isMacPlatform() ? menu.setAsAppMenu() : menu.setAsWindowMenu();
}

export async function activateMenuForFocusedWindow(
  menu: Menu,
  platform = navigator.userAgentData?.platform ?? navigator.platform,
) {
  if (isMacPlatform(platform)) await menu.setAsAppMenu();
}
