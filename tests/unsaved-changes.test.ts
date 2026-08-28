import { describe, expect, it, vi } from "vitest";
import {
  protectAction,
  resolveUnsavedChanges,
  saveShortcutFor,
  type UnsavedChangeDependencies,
} from "../src/unsaved-changes";

function dependencies(overrides: Partial<UnsavedChangeDependencies> = {}): UnsavedChangeDependencies {
  return {
    isDirty: () => true,
    displayName: () => "notes.md",
    prompt: vi.fn().mockResolvedValue("cancel"),
    save: vi.fn().mockResolvedValue({ status: "success", message: "Saved notes.md." }),
    ...overrides,
  };
}

describe("unsaved changes decisions", () => {
  it("proceeds without prompting when the document is clean", async () => {
    const prompt = vi.fn();
    await expect(resolveUnsavedChanges("Open", dependencies({ isDirty: () => false, prompt }))).resolves.toEqual({
      status: "proceed",
    });
    expect(prompt).not.toHaveBeenCalled();
  });

  it("proceeds when the user discards changes", async () => {
    const save = vi.fn();
    const prompt = vi.fn().mockResolvedValue("discard");
    await expect(resolveUnsavedChanges("New document", dependencies({ prompt, save }))).resolves.toEqual({
      status: "proceed",
    });
    expect(prompt).toHaveBeenCalledWith("notes.md", "New document");
    expect(save).not.toHaveBeenCalled();
  });

  it("cancels without saving when the user chooses Cancel", async () => {
    const save = vi.fn();
    await expect(resolveUnsavedChanges("Close", dependencies({ save }))).resolves.toEqual({
      status: "canceled",
      message: "Close canceled.",
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("saves and proceeds only after dirty state clears", async () => {
    let dirty = true;
    const save = vi.fn(async () => {
      dirty = false;
      return { status: "success" as const, message: "Saved notes.md." };
    });
    await expect(
      resolveUnsavedChanges(
        "Open",
        dependencies({ isDirty: () => dirty, prompt: vi.fn().mockResolvedValue("save"), save }),
      ),
    ).resolves.toEqual({ status: "proceed" });
    expect(save).toHaveBeenCalledOnce();
  });

  it.each([
    { status: "canceled" as const, message: "Save canceled." },
    { status: "failed" as const, message: "Could not save notes.md: disk full" },
  ])("blocks the action after a $status save", async (saveOutcome) => {
    await expect(
      resolveUnsavedChanges(
        "Close",
        dependencies({ prompt: vi.fn().mockResolvedValue("save"), save: vi.fn().mockResolvedValue(saveOutcome) }),
      ),
    ).resolves.toEqual(saveOutcome);
  });

  it("blocks the action when content changes during a successful save", async () => {
    await expect(
      resolveUnsavedChanges(
        "Open",
        dependencies({ prompt: vi.fn().mockResolvedValue("save") }),
      ),
    ).resolves.toEqual({
      status: "canceled",
      message: "Open canceled because the document changed while it was being saved.",
    });
  });

  it("reports prompt failures without proceeding", async () => {
    await expect(
      resolveUnsavedChanges("Close", dependencies({ prompt: vi.fn().mockRejectedValue(new Error("dialog failed")) })),
    ).resolves.toEqual({
      status: "failed",
      message: "Could not ask about unsaved changes: Error: dialog failed",
    });
  });

  it("runs the protected action only after the decision allows it", async () => {
    const operation = vi.fn().mockResolvedValue({ status: "success", message: "Opened next.md." });
    await expect(
      protectAction("Open", dependencies({ prompt: vi.fn().mockResolvedValue("discard") }), operation),
    ).resolves.toEqual({ status: "success", message: "Opened next.md." });
    expect(operation).toHaveBeenCalledOnce();

    operation.mockClear();
    await protectAction("Open", dependencies(), operation);
    expect(operation).not.toHaveBeenCalled();
  });
});

describe("save keyboard shortcuts", () => {
  it.each([
    [{ key: "s", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }, "save"],
    [{ key: "S", ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, "save"],
    [{ key: "s", ctrlKey: true, metaKey: false, shiftKey: true, altKey: false }, "save-as"],
    [{ key: "S", ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, "save-as"],
  ] as const)("maps %o to %s", (event, expected) => {
    expect(saveShortcutFor(event)).toBe(expected);
  });

  it.each([
    { key: "s", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
    { key: "o", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
    { key: "s", ctrlKey: true, metaKey: false, shiftKey: false, altKey: true },
  ])("ignores non-save shortcut %o", (event) => {
    expect(saveShortcutFor(event)).toBeNull();
  });
});
