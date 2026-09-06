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
}

const separator = () => PredefinedMenuItem.new({ item: "Separator" });

export async function createApplicationMenu(actions: ApplicationMenuActions): Promise<ApplicationMenuController> {
  const recentMenu = await Submenu.new({ text: "Recent Files", items: [] });
  let recentItems: MenuItem[] = [];
  const splitView = await CheckMenuItem.new({
    id: "view-split",
    text: "Split",
    accelerator: "CmdOrCtrl+1",
    action: () => actions.setView("both"),
  });
  const inputView = await CheckMenuItem.new({
    id: "view-input",
    text: "Input",
    accelerator: "CmdOrCtrl+2",
    action: () => actions.setView("input"),
  });
  const previewView = await CheckMenuItem.new({
    id: "view-preview",
    text: "Preview",
    accelerator: "CmdOrCtrl+3",
    action: () => actions.setView("preview"),
  });
  const syncScrolling = await CheckMenuItem.new({
    id: "view-sync-scrolling",
    text: "Sync Scrolling",
    checked: true,
    action: () => void syncScrolling.isChecked().then(actions.setSyncScrolling),
  });
  const swap = await MenuItem.new({ id: "view-swap", text: "Swap Panes", action: actions.swapPanes });
  const save = await MenuItem.new({ id: "file-save", text: "Save", accelerator: "CmdOrCtrl+S", action: actions.saveDocument });
  const saveAs = await MenuItem.new({ id: "file-save-as", text: "Save As…", accelerator: "CmdOrCtrl+Shift+S", action: actions.saveDocumentAs });

  const fileMenu = await Submenu.new({
    text: "File",
    items: [
      { id: "file-new", text: "New", accelerator: "CmdOrCtrl+N", action: actions.newDocument },
      { id: "file-open", text: "Open…", accelerator: "CmdOrCtrl+O", action: actions.openDocument },
      recentMenu,
      await separator(),
      save,
      saveAs,
      await separator(),
      { id: "file-print", text: "Print…", accelerator: "CmdOrCtrl+P", action: actions.printDocument },
      await separator(),
      { id: "file-close-tab", text: "Close Tab", accelerator: "CmdOrCtrl+W", action: actions.closeTab },
      { id: "file-close", text: "Close Window", accelerator: "CmdOrCtrl+Shift+W", action: actions.closeWindow },
    ],
  });
  const settings = await MenuItem.new({ id: "settings", text: "Settings…", accelerator: "CmdOrCtrl+,", action: actions.showSettings });
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
      { id: "edit-clear", text: "Clear", action: actions.clearDocument },
      ...(!mac ? [await separator(), settings] : []),
    ],
  });
  const insertMenu = await Submenu.new({
    text: "Insert",
    items: [{ id: "insert-table", text: "Table…", action: actions.showTableBuilder }],
  });
  const viewMenu = await Submenu.new({
    text: "View",
    items: [splitView, inputView, previewView, await separator(), syncScrolling, swap],
  });
  const helpMenu = await Submenu.new({
    text: "Help",
    items: [
      { id: "help-readme", text: "README", action: actions.showReadme },
      { id: "help-cheat-sheet", text: "Markdown Cheat Sheet", action: actions.showCheatSheet },
      { id: "help-examples", text: "Markdown Examples", action: actions.showExamples },
      await separator(),
      { id: "help-about", text: "About QuickMark", action: actions.showAbout },
    ],
  });
  const appMenus = mac ? [await Submenu.new({ text: "QuickMark", items: [settings] })] : [];
  const menu = await Menu.new({ items: [...appMenus, fileMenu, editMenu, insertMenu, viewMenu, helpMenu] });
  await attachWindowMenu(menu);

  return {
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
                id: `recent-${index}`,
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
