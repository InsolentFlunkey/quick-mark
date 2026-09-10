import { LINT_GROUPS, ruleEnabled, type RuleOverrides } from "./lint-rules";
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
    lintPreference?: { get(): boolean; set(enabled: boolean): Promise<void> };
    lintRules?: { get(): RuleOverrides; set(patch: RuleOverrides, reset?: boolean): Promise<void> };
    hasRecentFiles(): boolean;
    confirmClear(): Promise<boolean>;
    clearHistory(): Promise<void>;
  },
) {
  const clear = dialog.querySelector<HTMLButtonElement>("#settings-clear-recent")!;
  const close = dialog.querySelector<HTMLButtonElement>("#settings-close")!;
  const status = dialog.querySelector<HTMLElement>("#settings-status")!;
  const error = dialog.querySelector<HTMLElement>("#settings-error")!;
  const lint = dialog.querySelector<HTMLInputElement>("#settings-lint-before-saving");
  let busy = false;
  let previousFocus: HTMLElement | null = null;

  const ruleRoot = dialog.querySelector<HTMLElement>("#settings-lint-rules");
  const ruleControls: { input: HTMLInputElement; id: string }[] = [];
  const groupControls: { input: HTMLInputElement; group: typeof LINT_GROUPS[number]; count: HTMLElement }[] = [];
  let reset: HTMLButtonElement | null = null;
  async function saveRules(patch: RuleOverrides, origin: HTMLElement, resetDefaults = false) {
    if (busy || !dependencies.lintRules) { refresh(); return; }
    busy = true; error.hidden = true; refresh();
    try { await dependencies.lintRules.set(patch, resetDefaults); }
    catch (cause) { error.textContent = `Could not save lint rules: ${String(cause)}`; error.hidden = false; }
    finally { busy = false; refresh(); origin.focus(); }
  }
  if (ruleRoot) {
    for (const group of LINT_GROUPS) {
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      const label = document.createElement("label");
      const input = document.createElement("input"); input.type = "checkbox";
      input.setAttribute("aria-label", `Enable all ${group.name} rules`);
      const count = document.createElement("span"); count.className = "lint-rule-count";
      label.append(input, ` ${group.name}`); legend.append(label); fieldset.append(legend, count);
      groupControls.push({ input, group, count });
      input.addEventListener("change", () => {
        // Read the accepted model: a mixed group always enables all members.
        const choices = dependencies.lintRules?.get() ?? {};
        const members = group.rules.filter(rule => rule.available);
        const enabled = !members.every(rule => ruleEnabled(rule, choices));
        void saveRules(Object.fromEntries(members.map(rule => [rule.id, enabled])), input);
      });
      const details = document.createElement("details");
      const summary = document.createElement("summary"); summary.textContent = "Individual rules";
      details.append(summary);
      for (const rule of group.rules) {
        const row = document.createElement("label"); row.className = "lint-rule";
        const input = document.createElement("input"); input.type = "checkbox"; input.dataset.rule = rule.id;
        const text = document.createElement("span"); text.textContent = `${rule.id} — ${rule.description}`;
        if (rule.note) { const note = document.createElement("small"); note.textContent = rule.note; text.append(note); }
        row.append(input, text); details.append(row); ruleControls.push({ input, id: rule.id });
        input.addEventListener("change", () => void saveRules({ [rule.id]: input.checked }, input));
      }
      fieldset.append(details); ruleRoot.append(fieldset);
    }
    reset = document.createElement("button"); reset.type = "button"; reset.textContent = "Restore QuickMark Defaults";
    reset.addEventListener("click", () => void saveRules({}, reset!, true)); ruleRoot.append(reset);
  }

  function refresh() {
    const choices = dependencies.lintRules?.get() ?? {};
    for (const { input, group, count } of groupControls) {
      const members = group.rules.filter(rule => rule.available);
      const enabled = members.filter(rule => ruleEnabled(rule, choices)).length;
      input.checked = enabled === members.length; input.indeterminate = enabled > 0 && enabled < members.length;
      input.disabled = busy || !dependencies.lintRules;
      count.textContent = `${enabled} of ${members.length} available rules enabled`;
      for (const rule of group.rules) {
        const control = ruleControls.find(control => control.id === rule.id)!.input;
        control.checked = ruleEnabled(rule, choices); control.disabled = busy || !dependencies.lintRules || !rule.available;
      }
    }
    if (reset) reset.disabled = busy || !dependencies.lintRules;
    if (lint) { lint.checked = dependencies.lintPreference?.get() ?? false; lint.disabled = busy || !dependencies.lintPreference; }
    clear.disabled = busy || !dependencies.hasRecentFiles();
    close.disabled = busy;
    if (status.textContent === "" || status.textContent === "No Recent Files.") {
      status.textContent = dependencies.hasRecentFiles() ? "" : "No Recent Files.";
    }
  }
  lint?.addEventListener("change", async () => {
    if (busy || !dependencies.lintPreference) { refresh(); return; }
    const enabled = lint.checked;
    busy = true; error.hidden = true; refresh();
    try { await dependencies.lintPreference.set(enabled); }
    catch (cause) { error.textContent = `Could not save lint preference: ${String(cause)}`; error.hidden = false; }
    finally { busy = false; refresh(); lint.focus(); }
  });
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
