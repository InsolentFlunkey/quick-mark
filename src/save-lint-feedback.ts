import type { SaveReceipt, SaveSnapshot, SaveLintDecision } from "./document-operations";
import type { LintState } from "./lint-state";

/** One save transaction owns this surface until its explicit continuation resolves. */
export function createSaveLintFeedback(deps: {
  run(snapshot: SaveSnapshot): Promise<LintState>;
  cancel(): void;
  show(id: string): void;
}, root: HTMLElement = document.body) {
  const notices = document.createElement("section");
  notices.className = "save-lint-notices"; notices.setAttribute("aria-label", "Save lint feedback");
  const dialog = document.createElement("dialog"); dialog.className = "settings-dialog";
  dialog.setAttribute("aria-labelledby", "save-lint-title");
  dialog.setAttribute("aria-describedby", "save-lint-message");
  const title = document.createElement("h2"); title.id = "save-lint-title"; title.textContent = "Check before saving";
  const message = document.createElement("p"); message.id = "save-lint-message";
  const actions = document.createElement("div"); actions.className = "save-lint-actions";
  const content = document.createElement("div"); content.className = "settings-dialog__content";
  content.append(title, message, actions); dialog.append(content); root.append(notices, dialog);
  let pending = false;
  let focusTarget: HTMLButtonElement | null = null;
  dialog.addEventListener("cancel", event => event.preventDefault());
  const button = (label: string, action: () => void) => {
    const element = document.createElement("button"); element.type = "button"; element.textContent = label;
    element.addEventListener("click", action); return element;
  };
  function clean(name: string) {
    const notice = document.createElement("div");
    const text = document.createElement("p"); text.setAttribute("role", "status");
    text.textContent = `Save complete, no linter issues found — ${name}.`;
    const dismiss = () => { clearTimeout(timer); notice.remove(); };
    const close = button("Dismiss", dismiss);
    notice.append(text, close); notices.append(notice);
    const timer = setTimeout(dismiss, 5_000);
  }
  async function ask(text: string, failure: boolean): Promise<"review" | "save" | "cancel" | "retry"> {
    // Settings/About/Table Builder may have opened while the worker was running.
    // Wait for them rather than stacking independent modals.
    for (;;) {
      const other = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (!other) break;
      await new Promise<void>(resolve => other.addEventListener("close", () => resolve(), { once: true }));
    }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    message.textContent = text; actions.replaceChildren();
    return new Promise<"review" | "save" | "cancel" | "retry">((resolve, reject) => {
      let resolved = false;
      const keepOpen = () => { if (!resolved) { dialog.showModal(); focusTarget?.focus(); } };
      const finish = (choice: "review" | "save" | "cancel" | "retry") => {
        resolved = true; dialog.removeEventListener("close", keepOpen); dialog.close();
        focusTarget = null; previous?.focus(); resolve(choice);
      };
      const review = button(failure ? "Retry" : "Review Issues", () => finish(failure ? "retry" : "review"));
      const save = button("Save Anyway", () => finish("save"));
      const cancel = button("Cancel", () => finish("cancel"));
      actions.append(review, save, cancel); focusTarget = cancel;
      dialog.addEventListener("close", keepOpen);
      try { dialog.showModal(); cancel.focus(); }
      catch (error) { dialog.removeEventListener("close", keepOpen); focusTarget = null; reject(error); }
    });
  }
  return {
    focusPending() {
      if (!pending) return false;
      (focusTarget ?? document.querySelector<HTMLDialogElement>("dialog[open]") ?? notices).focus();
      return true;
    },
    completed(receipt: SaveReceipt) { clean(receipt.name); },
    async check(snapshot: SaveSnapshot): Promise<SaveLintDecision> {
      pending = true;
      try {
        for (;;) {
          const progress = document.createElement("div");
          const text = document.createElement("p"); text.setAttribute("role", "status");
          text.textContent = `Checking ${snapshot.name} before saving…`;
          const cancel = button("Cancel Lint", deps.cancel);
          progress.append(text, cancel); notices.append(progress); notices.tabIndex = -1;
          let result: LintState;
          try { result = await deps.run(snapshot); } finally { progress.remove(); }
          if (result.status === "failed" || result.status === "canceled") {
            const choice = await ask(`${snapshot.name} has not been saved. Linting ${result.status === "canceled" ? "was canceled" : "failed"}. ${result.error}`, true);
            if (choice === "retry") continue;
            return choice === "review" ? "cancel" : choice;
          }
          if (!result.issues.length) return "clean";
          const choice = await ask(`${snapshot.name} has not been saved. ${result.issues.length} linter ${result.issues.length === 1 ? "issue was" : "issues were"} found. Review the issues, save anyway, or cancel?`, false);
          if (choice === "review") deps.show(snapshot.documentId);
          if (choice === "retry") continue;
          return choice;
        }
      } finally { pending = false; }
    },
  };
}
