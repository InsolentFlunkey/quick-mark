import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearRecentHistory, createClearHistoryConfirmation, createSettingsController } from "../src/settings";
import { loadRecentFiles, saveRecentFiles } from "../src/recent-files";

function setup() {
  document.body.innerHTML = readFileSync("index.html", "utf8");
  const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
  dialog.showModal = vi.fn(() => { dialog.open = true; });
  const confirmClear = vi.fn(async () => false);
  const clearHistory = vi.fn(async () => { saveRecentFiles(localStorage, []); });
  const controller = createSettingsController(dialog, {
    hasRecentFiles: () => loadRecentFiles(localStorage).length > 0,
    confirmClear, clearHistory,
  });
  const clear = dialog.querySelector<HTMLButtonElement>("#settings-clear-recent")!;
  return { dialog, confirmClear, clearHistory, controller, clear };
}

beforeEach(() => { localStorage.clear(); saveRecentFiles(localStorage, ["/one.md", "/two.md"]); });

describe("Settings", () => {
  it("refreshes an open dialog when another editor clears or adds recent history", () => {
    const { controller, clear } = setup(); controller.open();
    saveRecentFiles(localStorage, []); controller.refresh();
    expect(clear.disabled).toBe(true);
    expect(document.querySelector("#settings-status")!.textContent).toBe("No Recent Files.");
    saveRecentFiles(localStorage, ["/new.md"]); controller.refresh();
    expect(clear.disabled).toBe(false);
    expect(document.querySelector("#settings-status")!.textContent).toBe("");
  });
  it("opens a named dialog without changing history, focuses Close, and ignores repeated opens", () => {
    const { controller, dialog, confirmClear } = setup();
    controller.open(); controller.open();
    expect(dialog.showModal).toHaveBeenCalledTimes(1);
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Settings");
    expect(document.activeElement?.id).toBe("settings-close");
    expect(confirmClear).not.toHaveBeenCalled();
    expect(loadRecentFiles(localStorage)).toEqual(["/one.md", "/two.md"]);
  });
  it("cancel preserves history and returns focus to Clear Recent Files", async () => {
    const { controller, clear, clearHistory } = setup(); controller.open(); clear.click();
    await vi.waitFor(() => expect(clear.disabled).toBe(false));
    expect(clearHistory).not.toHaveBeenCalled();
    expect(loadRecentFiles(localStorage)).toHaveLength(2);
    expect(document.activeElement).toBe(clear);
  });
  it("confirmation clears persisted history without touching editor content or other preferences", async () => {
    const { controller, clear, confirmClear } = setup();
    const editor = document.querySelector<HTMLTextAreaElement>("#editor")!;
    editor.value = "unsaved edits"; localStorage.setItem("other-preference", "keep");
    confirmClear.mockResolvedValue(true); controller.open(); clear.click();
    await vi.waitFor(() => expect(document.querySelector("#settings-status")?.textContent).toBe("Recent Files history cleared."));
    expect(loadRecentFiles(localStorage)).toEqual([]);
    expect(localStorage.getItem("other-preference")).toBe("keep");
    expect(editor.value).toBe("unsaved edits"); expect(clear.disabled).toBe(true);
    expect(document.activeElement?.id).toBe("settings-close");
  });
  it("prevents duplicate requests and Escape during a pending clear", async () => {
    const { controller, clear, confirmClear, dialog } = setup();
    let resolve!: (value: boolean) => void;
    confirmClear.mockImplementation(() => new Promise<boolean>(r => { resolve = r; }));
    controller.open(); clear.click(); clear.dispatchEvent(new MouseEvent("click"));
    const cancel = new Event("cancel", { cancelable: true }); dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true); expect(confirmClear).toHaveBeenCalledTimes(1);
    resolve(false); await vi.waitFor(() => expect(clear.disabled).toBe(false));
    const idleCancel = new Event("cancel", { cancelable: true }); dialog.dispatchEvent(idleCancel);
    expect(idleCancel.defaultPrevented).toBe(false);
  });
  it("reports confirmation and clearing errors inside the dialog", async () => {
    const { controller, clear, confirmClear } = setup();
    confirmClear.mockRejectedValue(new Error("dialog failure")); controller.open(); clear.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("#settings-error")!.hidden).toBe(false));
    expect(document.querySelector("#settings-error")?.textContent).toContain("dialog failure");
    expect(loadRecentFiles(localStorage)).toHaveLength(2);
  });
  it("disables empty history and restores the previous focus when closed", () => {
    const { controller, dialog, clear } = setup(); saveRecentFiles(localStorage, []);
    const editor = document.querySelector<HTMLTextAreaElement>("#editor")!; editor.focus(); controller.open();
    expect(clear.disabled).toBe(true); dialog.dispatchEvent(new Event("close"));
    expect(document.activeElement).toBe(editor);
  });
});

describe("clearRecentHistory", () => {
  it("persists empty history before synchronizing the menu", async () => {
    const replace = vi.fn(async (paths: string[]) => { expect(loadRecentFiles(localStorage)).toEqual([]); expect(paths).toEqual([]); });
    await clearRecentHistory(localStorage, replace); expect(replace).toHaveBeenCalledTimes(1);
  });
  it("does not change visible history when persistence fails", async () => {
    const replace = vi.fn();
    await expect(clearRecentHistory({ getItem: vi.fn(), setItem: () => { throw new Error("storage full"); } }, replace)).rejects.toThrow("storage full");
    expect(replace).not.toHaveBeenCalled();
  });
  it("exposes menu synchronization failure instead of reporting success", async () => {
    await expect(clearRecentHistory(localStorage, async () => { throw new Error("menu unavailable"); })).rejects.toThrow("menu unavailable");
    expect(loadRecentFiles(localStorage)).toEqual([]);
  });
});

describe("HTML clear confirmation", () => {
  it("focuses Cancel and treats dismissal as cancellation even after a previous confirmation", async () => {
    setup();
    const dialog = document.querySelector<HTMLDialogElement>("#clear-recent-dialog")!;
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    const confirm = createClearHistoryConfirmation(dialog);
    const first = confirm();
    expect(confirm()).toBe(first);
    expect(document.activeElement?.id).toBe("clear-recent-cancel");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Clear Recent Files?");
    dialog.returnValue = "clear"; dialog.dispatchEvent(new Event("close"));
    await expect(first).resolves.toBe(true);
    const second = confirm();
    expect(dialog.returnValue).toBe("cancel");
    dialog.dispatchEvent(new Event("close"));
    await expect(second).resolves.toBe(false);
    const third = confirm(); dialog.returnValue = "cancel"; dialog.dispatchEvent(new Event("close"));
    await expect(third).resolves.toBe(false);
  });
  it("reports a modal-opening failure and permits retry", async () => {
    setup(); const dialog = document.querySelector<HTMLDialogElement>("#clear-recent-dialog")!;
    dialog.showModal = vi.fn(() => { throw new Error("modal unavailable"); });
    const confirm = createClearHistoryConfirmation(dialog);
    await expect(confirm()).rejects.toThrow("modal unavailable");
    dialog.showModal = vi.fn(); const retry = confirm(); dialog.dispatchEvent(new Event("close"));
    await expect(retry).resolves.toBe(false);
  });
});

describe("lint Settings control", () => {
  it("refreshes from shared state, persists before displaying changes, and reports persistence failure", async () => {
    document.body.innerHTML = readFileSync("index.html", "utf8");
    const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
    let enabled = false;
    const set = vi.fn(async (value: boolean) => { enabled = value; });
    const controller = createSettingsController(dialog, { hasRecentFiles: () => false,
      confirmClear: vi.fn(), clearHistory: vi.fn(), lintPreference: { get: () => enabled, set } });
    const checkbox = document.querySelector<HTMLInputElement>("#settings-lint-before-saving")!;
    controller.refresh(); expect(checkbox.checked).toBe(false);
    checkbox.click(); expect(checkbox.checked).toBe(false);
    await vi.waitFor(() => expect(checkbox.checked).toBe(true));
    enabled = false; controller.refresh(); expect(checkbox.checked).toBe(false);
    set.mockRejectedValue(Error("permission denied")); checkbox.click();
    await vi.waitFor(() => expect(document.querySelector("#settings-error")!.textContent).toContain("permission denied"));
    expect(checkbox.checked).toBe(false); expect(checkbox.disabled).toBe(false);
  });
});

describe("lint rule controls", () => {
  function fixture() {
    document.body.innerHTML = readFileSync("index.html", "utf8");
    const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
    let rules: Record<string, boolean> = {};
    const set = vi.fn(async (patch: Record<string, boolean>, reset?: boolean) => { rules = reset ? {} : { ...rules, ...patch }; });
    const controller = createSettingsController(dialog, { hasRecentFiles: () => false, confirmClear: vi.fn(), clearHistory: vi.fn(),
      lintPreference: { get: () => true, set: vi.fn() }, lintRules: { get: () => rules, set } });
    controller.refresh();
    const rule = (id: string) => dialog.querySelector<HTMLInputElement>(`[data-rule="${id}"]`)!;
    const group = (name: string) => dialog.querySelector<HTMLInputElement>(`[aria-label="Enable all ${name} rules"]`)!;
    const settled = () => vi.waitFor(() => expect(group("Headings").disabled).toBe(false));
    return { controller, rule, group, set, settled, external: (value: Record<string, boolean>) => { rules = value; controller.refresh(); } };
  }
  it("uses direct group edits, mixed-to-all, and resets only rule choices", async () => {
    const f = fixture();
    expect(f.group("Headings").checked).toBe(true);
    f.rule("MD025").click(); expect(f.rule("MD025").checked).toBe(true); await f.settled();
    expect(f.rule("MD025").checked).toBe(false); expect(f.group("Headings").indeterminate).toBe(true);
    f.group("Headings").click(); await f.settled(); expect(f.rule("MD025").checked).toBe(true);
    f.group("Headings").click(); await f.settled(); expect(f.rule("MD001").checked).toBe(false);
    f.group("Headings").click(); await f.settled(); expect(f.rule("MD025").checked).toBe(true);
    expect(f.group("Links, images and HTML").indeterminate).toBe(true);
    f.group("Links, images and HTML").click(); await f.settled();
    expect(f.rule("MD034").checked).toBe(true); expect(f.rule("MD051").checked).toBe(false); expect(f.rule("MD051").disabled).toBe(true);
    expect(f.set.mock.calls.at(-1)![0]).not.toHaveProperty("MD051");
    [...document.querySelectorAll("button")].find(button => button.textContent === "Restore QuickMark Defaults")!.click(); await f.settled();
    expect(f.rule("MD034").checked).toBe(false); expect(f.rule("MD025").checked).toBe(true);
    expect(document.querySelector<HTMLInputElement>("#settings-lint-before-saving")!.checked).toBe(true);
  });
  it("reflects another window, retains accepted values on failure, and restores keyboard focus", async () => {
    const f = fixture(); f.external({ MD025: false }); expect(f.group("Headings").indeterminate).toBe(true);
    f.set.mockRejectedValue(Error("disk full")); f.rule("MD025").click(); await f.settled();
    expect(f.rule("MD025").checked).toBe(false); expect(document.querySelector("#settings-error")!.textContent).toContain("disk full");
    expect(document.activeElement).toBe(f.rule("MD025"));
  });
});
