export const OPERATION_TRANSIENT_DURATION_MS = 4_000;

export type OperationStatusOutcome = {
  readonly status: "success" | "canceled" | "failed";
  readonly message: string;
  readonly requiresAttention?: boolean;
};

export type OperationStatusController = {
  show(outcome: OperationStatusOutcome): void;
  dismissTransient(): void;
};

export function createOperationStatusController(
  element: HTMLElement | null,
  dismissButton: HTMLButtonElement | null,
  transientDurationMs = OPERATION_TRANSIENT_DURATION_MS,
): OperationStatusController {
  let clearTimer: ReturnType<typeof setTimeout> | null = null;
  let revision = 0;
  let currentIsTransient = false;

  const cancelPendingClear = () => {
    revision += 1;
    if (clearTimer !== null) clearTimeout(clearTimer);
    clearTimer = null;
  };

  const clear = () => {
    cancelPendingClear();
    currentIsTransient = false;
    if (element) {
      element.textContent = "";
      delete element.dataset.status;
    }
    if (dismissButton) dismissButton.hidden = true;
  };

  const controller: OperationStatusController = {
    show(outcome) {
      cancelPendingClear();
      currentIsTransient = outcome.status !== "failed" && !outcome.requiresAttention;
      if (element) {
        element.textContent = outcome.message;
        element.dataset.status = outcome.status;
      }
      if (dismissButton) dismissButton.hidden = currentIsTransient;

      if (!currentIsTransient) return;
      const scheduledRevision = revision;
      clearTimer = setTimeout(() => {
        if (revision !== scheduledRevision) return;
        clear();
      }, transientDurationMs);
    },
    dismissTransient() {
      if (currentIsTransient) clear();
    },
  };

  dismissButton?.addEventListener("click", clear);
  return controller;
}
