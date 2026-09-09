import { afterEach, describe, expect, it, vi } from "vitest";
import { createSaveLintFeedback } from "../src/save-lint-feedback";
import { PROFILE_VERSION, type LintState } from "../src/lint-state";

const snapshot = { documentId: "origin", operationId: "write-1", revision: 1, content: "text", path: "/saved.md", name: "saved.md" };
const issue = { rule: "MD041", message: "Heading", line: 1, column: null, length: null, detail: "", context: "text" };
function mockDialog(dialog: HTMLDialogElement) {
  dialog.showModal = vi.fn(() => { dialog.open = true; });
  dialog.close = vi.fn(() => { dialog.open = false; dialog.dispatchEvent(new Event("close")); });
}
function setup(issues = true) {
  document.body.innerHTML = '<button id="origin">Save</button>';
  const result: LintState = { profile: PROFILE_VERSION, source: "text", status: "complete", issues: issues ? [issue] : [],
    error: "", inspecting: false, pane: "results", selected: 0, visible: 200, resultsScroll: 0 };
  const deps = { run: vi.fn(async () => result), cancel: vi.fn(), show: vi.fn() };
  const feedback = createSaveLintFeedback(deps); const dialog = document.querySelector("dialog")!; mockDialog(dialog);
  const click = (label: string) => [...document.querySelectorAll("button")].find(button => button.textContent === label)!.click();
  return { feedback, deps, result, click, dialog };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("pre-save lint feedback", () => {
  it("returns clean without claiming a save, and only confirms an actual write for five seconds", async () => {
    vi.useFakeTimers(); const f = setup(false);
    expect(await f.feedback.check(snapshot)).toBe("clean"); expect(document.body.textContent).not.toContain("Save complete");
    f.feedback.completed(snapshot); expect(document.body.textContent).toContain("Save complete, no linter issues found — saved.md");
    await vi.advanceTimersByTimeAsync(4999); expect(document.querySelector(".save-lint-notices")!.textContent).toContain("no linter issues");
    await vi.advanceTimersByTimeAsync(1); expect(document.querySelector(".save-lint-notices")!.textContent).toBe("");
    f.feedback.completed(snapshot); f.click("Dismiss"); expect(document.querySelector(".save-lint-notices")!.textContent).toBe("");
  });
  it("focuses Cancel and rejects Escape, backdrop, ambiguous close and timeout", async () => {
    vi.useFakeTimers(); const f = setup(); document.querySelector<HTMLButtonElement>("#origin")!.focus();
    const pending = f.feedback.check(snapshot); await vi.advanceTimersByTimeAsync(0);
    expect(f.dialog.textContent).toContain("has not been saved"); expect(document.activeElement?.textContent).toBe("Cancel");
    const event = new Event("cancel", { cancelable: true }); f.dialog.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    f.dialog.click(); f.dialog.close(); expect(f.dialog.open).toBe(true);
    expect(f.feedback.focusPending()).toBe(true); expect(document.activeElement?.textContent).toBe("Cancel");
    await vi.advanceTimersByTimeAsync(60_000); expect(f.dialog.open).toBe(true);
    f.click("Cancel"); expect(await pending).toBe("cancel"); expect(f.deps.show).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe("origin"); expect(f.feedback.focusPending()).toBe(false);
  });
  it.each([["Review Issues", "review"], ["Save Anyway", "save"], ["Cancel", "cancel"]])("%s has an explicit independent result", async (label, decision) => {
    const f = setup(); const pending = f.feedback.check(snapshot);
    await vi.waitFor(() => expect(f.dialog.open).toBe(true)); f.click(label); expect(await pending).toBe(decision);
    if (decision === "review") expect(f.deps.show).toHaveBeenCalledWith("origin"); else expect(f.deps.show).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("Save complete");
    // Actions belong below the message and must not inherit the absolute toolbar class.
    expect(f.dialog.querySelector(".lint-controls")).toBeNull();
    expect(f.dialog.querySelector("#save-lint-message")!.nextElementSibling?.className).toBe("save-lint-actions");
  });
  it.each(["failed", "canceled"] as const)("reports %s without writing or presenting findings", async status => {
    const f = setup(); f.deps.run.mockResolvedValue({ ...f.result, status, error: "worker detail" });
    const pending = f.feedback.check(snapshot); await vi.waitFor(() => expect(f.dialog.open).toBe(true));
    expect(f.dialog.textContent).toContain("has not been saved"); expect(f.dialog.textContent).toContain("worker detail");
    expect(f.dialog.textContent).not.toContain("issues were found"); f.click("Save Anyway"); expect(await pending).toBe("save");
  });
  it("Retry checks the same pending snapshot and still requires an explicit choice if issues remain", async () => {
    const f = setup(); f.deps.run.mockResolvedValueOnce({ ...f.result, status: "failed", error: "Linting timed out after 10 seconds." });
    const pending = f.feedback.check(snapshot); await vi.waitFor(() => expect(f.dialog.open).toBe(true));
    expect(f.dialog.textContent).toContain("timed out"); f.click("Retry");
    await vi.waitFor(() => expect(f.dialog.textContent).toContain("Review Issues"));
    expect(f.deps.run).toHaveBeenNthCalledWith(2, snapshot); f.click("Cancel"); expect(await pending).toBe("cancel");
  });
  it("a clean retry authorizes saving without a premature confirmation", async () => {
    const f = setup(false); f.deps.run.mockResolvedValueOnce({ ...f.result, status: "failed", error: "worker failure" });
    const pending = f.feedback.check(snapshot); await vi.waitFor(() => expect(f.dialog.open).toBe(true)); f.click("Retry");
    expect(await pending).toBe("clean"); expect(document.body.textContent).not.toContain("Save complete");
  });
  it("queues behind an existing modal", async () => {
    const f = setup(); const other = document.createElement("dialog"); document.body.append(other); mockDialog(other); other.showModal();
    const pending = f.feedback.check(snapshot); await Promise.resolve(); await Promise.resolve(); expect(f.dialog.open).toBe(false);
    other.close(); await vi.waitFor(() => expect(f.dialog.open).toBe(true)); f.click("Cancel"); await pending;
  });
  it("Cancel Lint offers Retry, Save Anyway or Cancel", async () => {
    const f = setup(); let finish!: (state: LintState) => void;
    f.deps.run.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = f.feedback.check(snapshot); f.click("Cancel Lint"); expect(f.deps.cancel).toHaveBeenCalledOnce();
    finish({ ...f.result, status: "canceled", error: "Linting canceled." });
    await vi.waitFor(() => expect(f.dialog.open).toBe(true)); f.click("Cancel"); expect(await pending).toBe("cancel");
  });
});
