import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import type { ReferenceKind } from "./reference-window-services";
import type { ViewMode } from "./view-preferences";
import { activateMenuForFocusedWindow, attachWindowMenu } from "./menu-platform";

export interface ReferenceMenuActions {
  saveAs(): void;
  reset(): void;
  print(): void;
  close(): void;
  setView(mode: ViewMode): void;
  setSyncScrolling(enabled: boolean): void;
  swap(): void;
}

export async function createReferenceMenu(kind: ReferenceKind, actions: ReferenceMenuActions) {
  const separator = () => PredefinedMenuItem.new({ item: "Separator" });
  const fileItems = [];
  if (kind === "examples") fileItems.push({ id: "reference-save-as", text: "Save As…", accelerator: "CmdOrCtrl+Shift+S", action: actions.saveAs });
  fileItems.push({ id: "reference-print", text: "Print…", accelerator: "CmdOrCtrl+P", action: actions.print });
  fileItems.push(await separator());
  fileItems.push({ id: "reference-close", text: "Close", accelerator: "CmdOrCtrl+W", action: actions.close });
  const file = await Submenu.new({ text: "File", items: fileItems });
  const menus: Submenu[] = [file];
  let modes: CheckMenuItem[] = [];
  let syncScrolling: CheckMenuItem | null = null;

  if (kind === "examples") {
    menus.push(await Submenu.new({ text: "Edit", items: [
      await PredefinedMenuItem.new({ item: "Undo" }), await PredefinedMenuItem.new({ item: "Redo" }),
      await separator(), await PredefinedMenuItem.new({ item: "Cut" }), await PredefinedMenuItem.new({ item: "Copy" }),
      await PredefinedMenuItem.new({ item: "Paste" }), await PredefinedMenuItem.new({ item: "SelectAll" }),
      await separator(), { id: "reference-reset", text: "Reset Examples", action: actions.reset },
    ] }));
    modes = await Promise.all((["both", "input", "preview"] as const).map((mode) => CheckMenuItem.new({
      id: `reference-view-${mode}`, text: mode === "both" ? "Split" : mode[0].toUpperCase() + mode.slice(1),
      checked: mode === "both", action: () => { actions.setView(mode); void setView(mode); },
    })));
    syncScrolling = await CheckMenuItem.new({
      id: "reference-sync-scrolling", text: "Sync Scrolling", checked: true,
      action: () => void syncScrolling!.isChecked().then(actions.setSyncScrolling),
    });
    menus.push(await Submenu.new({ text: "View", items: [...modes, await separator(),
      syncScrolling, await MenuItem.new({ id: "reference-swap", text: "Swap Panes", action: actions.swap })] }));
  }

  const menu = await Menu.new({ items: menus });
  async function setView(mode: ViewMode) {
    if (kind !== "examples") return;
    await Promise.all(((["both", "input", "preview"] as const)).map((candidate, index) =>
      modes[index].setChecked(candidate === mode),
    ));
    await syncScrolling?.setEnabled(mode === "both");
  }
  await attachWindowMenu(menu);
  return {
    activate: () => activateMenuForFocusedWindow(menu),
    setView,
    setSyncScrolling: (enabled: boolean) => syncScrolling?.setChecked(enabled) ?? Promise.resolve(),
  };
}
