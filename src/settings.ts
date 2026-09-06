import { saveRecentFiles, type RecentFilesStorage } from "./recent-files";

// Persistence must succeed before the visible history is changed.
export async function clearRecentHistory(
  storage: RecentFilesStorage,
  replaceHistory: (paths: string[]) => Promise<void>,
) {
  saveRecentFiles(storage, []);
  await replaceHistory([]);
}

export function createSettingsController(
  dialog: HTMLDialogElement,
  dependencies: {
    hasRecentFiles(): boolean;
    confirmClear(): Promise<boolean>;
    clearHistory(): Promise<void>;
  },
) {
  const clear = dialog.querySelector<HTMLButtonElement>("#settings-clear-recent")!;
  const close = dialog.querySelector<HTMLButtonElement>("#settings-close")!;
  const status = dialog.querySelector<HTMLElement>("#settings-status")!;
  const error = dialog.querySelector<HTMLElement>("#settings-error")!;
  let busy = false;
  let previousFocus: HTMLElement | null = null;

  function refresh() {
    clear.disabled = busy || !dependencies.hasRecentFiles();
    close.disabled = busy;
    if (status.textContent === "" || status.textContent === "No Recent Files.") {
      status.textContent = dependencies.hasRecentFiles() ? "" : "No Recent Files.";
    }
  }
  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
  });
  dialog.addEventListener("close", () => previousFocus?.focus());
  clear.addEventListener("click", async () => {
    if (busy || !dependencies.hasRecentFiles()) return;
    busy = true;
    error.hidden = true;
    status.textContent = "";
    refresh();
    try {
      if (await dependencies.confirmClear()) {
        await dependencies.clearHistory();
        status.textContent = "Recent Files history cleared.";
      }
    } catch (cause) {
      error.textContent = `Could not clear Recent Files: ${String(cause)}`;
      error.hidden = false;
    } finally {
      busy = false;
      refresh();
      (clear.disabled ? close : clear).focus();
    }
  });
  return {
    refresh,
    open() {
      if (dialog.open) return;
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      error.hidden = true;
      status.textContent = dependencies.hasRecentFiles() ? "" : "No Recent Files.";
      refresh();
      dialog.showModal();
      close.focus();
    },
  };
}

export function createClearHistoryConfirmation(dialog: HTMLDialogElement) {
  let pending: Promise<boolean> | null = null;
  return () => {
    if (pending) return pending;
    pending = new Promise<boolean>((resolve, reject) => {
      const finish = () => {
        pending = null;
        resolve(dialog.returnValue === "clear");
      };
      dialog.returnValue = "cancel";
      dialog.addEventListener("close", finish, { once: true });
      try {
        dialog.showModal();
        dialog.querySelector<HTMLButtonElement>("#clear-recent-cancel")!.focus();
      } catch (error) {
        dialog.removeEventListener("close", finish);
        reject(error);
      }
    });
    // Reset after showModal failures as well as normal closure.
    void pending.catch(() => { pending = null; });
    return pending;
  };
}
