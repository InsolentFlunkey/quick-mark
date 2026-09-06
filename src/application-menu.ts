import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  CheckMenuItem,
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from "@tauri-apps/api/menu";
import { recentFileLabel } from "./recent-files";
import type { ViewMode } from "./view-preferences";
import { activateMenuForFocusedWindow, attachWindowMenu, isMacPlatform } from "./menu-platform";

export interface ApplicationMenuActions {
  newDocument(): void;
  openDocument(): void;
  openRecent(path: string): void;
  saveDocument(): void;
  saveDocumentAs(): void;
  clearDocument(): void;
  showTableBuilder(): void;
  printDocument(): void;
  closeWindow(): void;
  closeTab(): void;
  detachTab(): void;
  setView(mode: ViewMode): void;
  setSyncScrolling(enabled: boolean): void;
  swapPanes(): void;
  showAbout(): void;
  showSettings(): void;
  showReadme(): void;
  showExamples(): void;
  showCheatSheet(): void;
}

export interface ApplicationMenuController {
  setRecentFiles(paths: readonly string[]): Promise<void>;
  setView(mode: ViewMode, swapped: boolean, syncScrolling: boolean): Promise<void>;
  setDocumentCapabilities(canSave: boolean, canSaveAs: boolean): Promise<void>;
  activate(): Promise<void>;
  setBusy(busy: boolean): Promise<void>;
}

const separator = () => PredefinedMenuItem.new({ item: "Separator" });

export async function createApplicationMenu(actions: ApplicationMenuActions): Promise<ApplicationMenuController> {
  const label = getCurrentWindow().label;
  const itemId = (name: string) => `${label}:${name}`;
  const recentMenu = await Submenu.new({ text: "Recent Files", items: [] });
  let recentItems: MenuItem[] = [];
  const splitView = await CheckMenuItem.new({
    id: itemId("view-split"),
    text: "Split",
    accelerator: "CmdOrCtrl+1",
    action: () => actions.setView("both"),
  });
  const inputView = await CheckMenuItem.new({
    id: itemId("view-input"),
    text: "Input",
    accelerator: "CmdOrCtrl+2",
    action: () => actions.setView("input"),
  });
  const previewView = await CheckMenuItem.new({
    id: itemId("view-preview"),
    text: "Preview",
    accelerator: "CmdOrCtrl+3",
    action: () => actions.setView("preview"),
  });
  const syncScrolling = await CheckMenuItem.new({
    id: itemId("view-sync-scrolling"),
    text: "Sync Scrolling",
    checked: true,
    action: () => void syncScrolling.isChecked().then(actions.setSyncScrolling),
  });
  const swap = await MenuItem.new({ id: itemId("view-swap"), text: "Swap Panes", action: actions.swapPanes });
  const save = await MenuItem.new({ id: itemId("file-save"), text: "Save", accelerator: "CmdOrCtrl+S", action: actions.saveDocument });
  const saveAs = await MenuItem.new({ id: itemId("file-save-as"), text: "Save As…", accelerator: "CmdOrCtrl+Shift+S", action: actions.saveDocumentAs });

  const detach = await MenuItem.new({ id: itemId("file-detach"), text: "Move Tab to New Window", action: actions.detachTab });
  const fileMenu = await Submenu.new({
    text: "File",
    items: [
      { id: itemId("file-new"), text: "New", accelerator: "CmdOrCtrl+N", action: actions.newDocument },
      { id: itemId("file-open"), text: "Open…", accelerator: "CmdOrCtrl+O", action: actions.openDocument },
      recentMenu,
      await separator(),
      save,
      saveAs,
      await separator(),
      { id: itemId("file-print"), text: "Print…", accelerator: "CmdOrCtrl+P", action: actions.printDocument },
      await separator(),
      detach,
      { id: itemId("file-close-tab"), text: "Close Tab", accelerator: "CmdOrCtrl+W", action: actions.closeTab },
      { id: itemId("file-close"), text: "Close Window", accelerator: "CmdOrCtrl+Shift+W", action: actions.closeWindow },
    ],
  });
  const settings = await MenuItem.new({ id: itemId("settings"), text: "Settings…", accelerator: "CmdOrCtrl+,", action: actions.showSettings });
  const mac = isMacPlatform();
  const editMenu = await Submenu.new({
    text: "Edit",
    items: [
      await PredefinedMenuItem.new({ item: "Undo" }),
      await PredefinedMenuItem.new({ item: "Redo" }),
      await separator(),
      await PredefinedMenuItem.new({ item: "Cut" }),
      await PredefinedMenuItem.new({ item: "Copy" }),
      await PredefinedMenuItem.new({ item: "Paste" }),
      await PredefinedMenuItem.new({ item: "SelectAll" }),
      await separator(),
      { id: itemId("edit-clear"), text: "Clear", action: actions.clearDocument },
      ...(!mac ? [await separator(), settings] : []),
    ],
  });
  const insertMenu = await Submenu.new({
    text: "Insert",
    items: [{ id: itemId("insert-table"), text: "Table…", action: actions.showTableBuilder }],
  });
  const viewMenu = await Submenu.new({
    text: "View",
    items: [splitView, inputView, previewView, await separator(), syncScrolling, swap],
  });
  const helpMenu = await Submenu.new({
    text: "Help",
    items: [
      { id: itemId("help-readme"), text: "README", action: actions.showReadme },
      { id: itemId("help-cheat-sheet"), text: "Markdown Cheat Sheet", action: actions.showCheatSheet },
      { id: itemId("help-examples"), text: "Markdown Examples", action: actions.showExamples },
      await separator(),
      { id: itemId("help-about"), text: "About QuickMark", action: actions.showAbout },
    ],
  });
  const appMenus = mac ? [await Submenu.new({ text: "QuickMark", items: [settings] })] : [];
  const menu = await Menu.new({ items: [...appMenus, fileMenu, editMenu, insertMenu, viewMenu, helpMenu] });
  await attachWindowMenu(menu);

  return {
    async setBusy(busy) { await detach.setEnabled(!busy); },
    async activate() { await activateMenuForFocusedWindow(menu); },
    async setRecentFiles(paths) {
      for (const item of recentItems) {
        await recentMenu.remove(item);
        await item.close();
      }
      recentItems = paths.length === 0
        ? [await MenuItem.new({ text: "No Recent Files", enabled: false })]
        : await Promise.all(
            paths.map((path, index) =>
              MenuItem.new({
                id: itemId(`recent-${index}`),
                text: recentFileLabel(path),
                action: () => actions.openRecent(path),
              }),
            ),
          );
      await recentMenu.append(recentItems);
    },
    async setView(mode, _swapped, syncEnabled) {
      await Promise.all([
        splitView.setChecked(mode === "both"),
        inputView.setChecked(mode === "input"),
        previewView.setChecked(mode === "preview"),
        syncScrolling.setChecked(syncEnabled),
        syncScrolling.setEnabled(mode === "both"),
        swap.setEnabled(mode === "both"),
      ]);
    },
    async setDocumentCapabilities(canSave, canSaveAs) {
      await Promise.all([save.setEnabled(canSave), saveAs.setEnabled(canSaveAs)]);
    },
  };
}
