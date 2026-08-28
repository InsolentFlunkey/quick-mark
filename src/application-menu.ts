import {
  CheckMenuItem,
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from "@tauri-apps/api/menu";
import { recentFileLabel } from "./recent-files";
import type { ViewMode } from "./view-preferences";

export interface ApplicationMenuActions {
  newDocument(): void;
  openDocument(): void;
  openRecent(path: string): void;
  saveDocument(): void;
  saveDocumentAs(): void;
  clearDocument(): void;
  printDocument(): void;
  closeWindow(): void;
  setView(mode: ViewMode): void;
  swapPanes(): void;
  showAbout(): void;
}

export interface ApplicationMenuController {
  setRecentFiles(paths: readonly string[]): Promise<void>;
  setView(mode: ViewMode, swapped: boolean): Promise<void>;
}

const separator = () => PredefinedMenuItem.new({ item: "Separator" });

export async function createApplicationMenu(actions: ApplicationMenuActions): Promise<ApplicationMenuController> {
  const recentMenu = await Submenu.new({ text: "Recent Files", enabled: false, items: [] });
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
  const swap = await MenuItem.new({ id: "view-swap", text: "Swap Panes", action: actions.swapPanes });

  const fileMenu = await Submenu.new({
    text: "File",
    items: [
      { id: "file-new", text: "New", accelerator: "CmdOrCtrl+N", action: actions.newDocument },
      { id: "file-open", text: "Open…", accelerator: "CmdOrCtrl+O", action: actions.openDocument },
      recentMenu,
      await separator(),
      { id: "file-save", text: "Save", accelerator: "CmdOrCtrl+S", action: actions.saveDocument },
      { id: "file-save-as", text: "Save As…", accelerator: "CmdOrCtrl+Shift+S", action: actions.saveDocumentAs },
      await separator(),
      { id: "file-print", text: "Print…", accelerator: "CmdOrCtrl+P", action: actions.printDocument },
      await separator(),
      { id: "file-close", text: "Close", accelerator: "CmdOrCtrl+W", action: actions.closeWindow },
    ],
  });
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
    ],
  });
  const viewMenu = await Submenu.new({ text: "View", items: [splitView, inputView, previewView, await separator(), swap] });
  const helpMenu = await Submenu.new({
    text: "Help",
    items: [
      { id: "help-readme", text: "README (coming soon)", enabled: false },
      { id: "help-examples", text: "Markdown Examples (coming soon)", enabled: false },
      await separator(),
      { id: "help-about", text: "About QuickMark", action: actions.showAbout },
    ],
  });
  const menu = await Menu.new({ items: [fileMenu, editMenu, viewMenu, helpMenu] });
  await menu.setAsAppMenu();

  return {
    async setRecentFiles(paths) {
      for (const item of await recentMenu.items()) await recentMenu.remove(item);
      if (paths.length === 0) {
        await recentMenu.append({ text: "No Recent Files", enabled: false });
        await recentMenu.setEnabled(false);
        return;
      }
      await recentMenu.append(
        paths.map((path, index) => ({
          id: `recent-${index}`,
          text: recentFileLabel(path),
          action: () => actions.openRecent(path),
        })),
      );
      await recentMenu.setEnabled(true);
    },
    async setView(mode, swapped) {
      await Promise.all([
        splitView.setChecked(mode === "both"),
        inputView.setChecked(mode === "input"),
        previewView.setChecked(mode === "preview"),
        swap.setEnabled(mode === "both"),
        swap.setText(swapped ? "Restore Pane Order" : "Swap Panes"),
      ]);
    },
  };
}
