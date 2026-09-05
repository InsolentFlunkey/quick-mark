import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ mac: false, menus: [] as any[], items: [] as any[] }));
vi.mock("../src/menu-platform", () => ({
  isMacPlatform: () => mocks.mac, attachWindowMenu: vi.fn(), activateMenuForFocusedWindow: vi.fn(),
}));
vi.mock("@tauri-apps/api/menu", () => {
  const create = async (options: any) => {
    const resource = { ...options, append: vi.fn(), remove: vi.fn(), close: vi.fn(), setChecked: vi.fn(), setEnabled: vi.fn() };
    mocks.items.push(resource); return resource;
  };
  return { MenuItem: { new: create }, CheckMenuItem: { new: create }, PredefinedMenuItem: { new: create },
    Submenu: { new: create }, Menu: { new: async (options: any) => { mocks.menus.push(options); return options; } } };
});
import { createApplicationMenu, type ApplicationMenuActions } from "../src/application-menu";
beforeEach(() => { mocks.items.length = 0; mocks.menus.length = 0; mocks.mac = false; });
function actions() {
  return new Proxy({ showSettings: vi.fn(), openRecent: vi.fn() }, { get: (target, key) => target[key as keyof typeof target] ?? vi.fn() }) as unknown as ApplicationMenuActions;
}
it.each([false, true])("routes Settings to the approved menu (mac=%s)", async (mac) => {
  mocks.mac = mac; const handlers = actions(); await createApplicationMenu(handlers);
  const settings = mocks.items.find(i => i.id === "settings");
  const parent = mocks.items.find(i => i.text === (mac ? "QuickMark" : "Edit"));
  expect(parent.items).toContain(settings); expect(settings.text).toBe("Settings…");
  expect(settings.accelerator).toBe("CmdOrCtrl+,"); settings.action(); expect(handlers.showSettings).toHaveBeenCalledOnce();
  expect(mocks.items.find(i => i.text === "Recent Files").items).toEqual([]);
});
it("replaces populated recent menu resources with a disabled placeholder", async () => {
  const handlers = actions(); const controller = await createApplicationMenu(handlers);
  await controller.setRecentFiles(["/one.md"]);
  const item = mocks.items.find(i => i.id === "recent-0"); item.action();
  expect(handlers.openRecent).toHaveBeenCalledWith("/one.md");
  await controller.setRecentFiles([]);
  const submenu = mocks.items.find(i => i.text === "Recent Files");
  expect(submenu.remove).toHaveBeenCalledWith(item); expect(item.close).toHaveBeenCalledOnce();
  expect(submenu.append).toHaveBeenLastCalledWith([expect.objectContaining({ text: "No Recent Files", enabled: false })]);
});
