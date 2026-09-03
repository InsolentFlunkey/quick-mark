import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOperationStatusController, OPERATION_TRANSIENT_DURATION_MS } from "../src/operation-status";

describe("operation status controller", () => {
  let element: HTMLElement;
  let dismissButton: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement("p");
    dismissButton = document.createElement("button");
    dismissButton.hidden = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears successful outcomes after four seconds", () => {
    const controller = createOperationStatusController(element, dismissButton);
    controller.show({ status: "success", message: "Saved notes.md." });

    vi.advanceTimersByTime(OPERATION_TRANSIENT_DURATION_MS - 1);
    expect(element.textContent).toBe("Saved notes.md.");
    expect(element.dataset.status).toBe("success");
    expect(dismissButton.hidden).toBe(true);

    vi.advanceTimersByTime(1);
    expect(element.textContent).toBe("");
    expect(element.dataset.status).toBeUndefined();
  });

  it("dismisses a current success immediately when editing begins", () => {
    const controller = createOperationStatusController(element, dismissButton);
    controller.show({ status: "success", message: "Saved notes.md." });

    controller.dismissTransient();

    expect(element.textContent).toBe("");
    expect(element.dataset.status).toBeUndefined();
  });

  it("does not let an older success timer clear a newer outcome", () => {
    const controller = createOperationStatusController(element, dismissButton);
    controller.show({ status: "success", message: "Saved first.md." });
    vi.advanceTimersByTime(2_000);
    controller.show({ status: "success", message: "Saved second.md." });

    vi.advanceTimersByTime(2_000);
    expect(element.textContent).toBe("Saved second.md.");

    vi.advanceTimersByTime(2_000);
    expect(element.textContent).toBe("");
  });

  it("clears routine cancellation outcomes after four seconds or an edit", () => {
    const controller = createOperationStatusController(element, dismissButton);
    controller.show({ status: "canceled", message: "Open canceled." });

    vi.advanceTimersByTime(OPERATION_TRANSIENT_DURATION_MS);
    expect(element.textContent).toBe("");

    controller.show({ status: "canceled", message: "Save canceled." });
    controller.dismissTransient();
    expect(element.textContent).toBe("");
  });

  it.each([
    { status: "failed" as const, message: "Could not save notes.md." },
    {
      status: "canceled" as const,
      message: "Open canceled because the document changed while it was being saved.",
      requiresAttention: true,
    },
  ])("keeps persistent outcomes visible until dismissed", (outcome) => {
    const controller = createOperationStatusController(element, dismissButton);
    controller.show(outcome);

    controller.dismissTransient();
    vi.advanceTimersByTime(OPERATION_TRANSIENT_DURATION_MS * 2);

    expect(element.textContent).toBe(outcome.message);
    expect(element.dataset.status).toBe(outcome.status);
    expect(dismissButton.hidden).toBe(false);

    dismissButton.click();
    expect(element.textContent).toBe("");
    expect(element.dataset.status).toBeUndefined();
    expect(dismissButton.hidden).toBe(true);
  });
});
