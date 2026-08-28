import { describe, expect, it, vi } from "vitest";
import { DocumentLifecycle } from "../src/document-lifecycle";
import { openDocument, saveDocument, type DocumentFileServices } from "../src/document-operations";

function services(overrides: Partial<DocumentFileServices> = {}): DocumentFileServices {
  return {
    selectOpenPath: vi.fn().mockResolvedValue(null),
    selectSavePath: vi.fn().mockResolvedValue(null),
    readText: vi.fn().mockRejectedValue(new Error("unexpected read")),
    writeText: vi.fn().mockRejectedValue(new Error("unexpected write")),
    ...overrides,
  };
}

describe("open document coordination", () => {
  it("selects, reads, and loads a document", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("old draft");
    const fileServices = services({
      selectOpenPath: vi.fn().mockResolvedValue("/notes/opened.md"),
      readText: vi.fn().mockResolvedValue("# Opened"),
    });

    await expect(openDocument(lifecycle, fileServices)).resolves.toEqual({
      status: "success",
      message: "Opened opened.md.",
    });
    expect(fileServices.readText).toHaveBeenCalledWith("/notes/opened.md");
    expect(lifecycle.snapshot).toMatchObject({
      content: "# Opened",
      displayName: "opened.md",
      filePath: "/notes/opened.md",
      dirty: false,
    });
  });

  it("opens a launch path without showing a picker", async () => {
    const lifecycle = new DocumentLifecycle();
    const fileServices = services({ readText: vi.fn().mockResolvedValue("launch content") });

    await openDocument(lifecycle, fileServices, "C:\\notes\\launch.markdown");
    expect(fileServices.selectOpenPath).not.toHaveBeenCalled();
    expect(fileServices.readText).toHaveBeenCalledWith("C:\\notes\\launch.markdown");
    expect(lifecycle.snapshot.displayName).toBe("launch.markdown");
  });

  it("preserves the active document when Open is canceled", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("keep me");
    const before = lifecycle.snapshot;

    await expect(openDocument(lifecycle, services())).resolves.toEqual({
      status: "canceled",
      message: "Open canceled.",
    });
    expect(lifecycle.snapshot).toEqual(before);
  });

  it("preserves the active document and reports read failures", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("keep me");
    const before = lifecycle.snapshot;
    const fileServices = services({
      selectOpenPath: vi.fn().mockResolvedValue("/notes/broken.md"),
      readText: vi.fn().mockRejectedValue(new Error("permission denied")),
    });

    const outcome = await openDocument(lifecycle, fileServices);
    expect(outcome).toEqual({
      status: "failed",
      message: "Could not open broken.md: permission denied",
    });
    expect(lifecycle.snapshot).toEqual(before);
  });
});

describe("save document coordination", () => {
  it("writes an opened document to its existing path without a dialog", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "old", filePath: "/notes/existing.md" });
    lifecycle.edit("updated");
    const fileServices = services({ writeText: vi.fn().mockResolvedValue(undefined) });

    await expect(saveDocument(lifecycle, fileServices)).resolves.toEqual({
      status: "success",
      message: "Saved existing.md.",
    });
    expect(fileServices.selectSavePath).not.toHaveBeenCalled();
    expect(fileServices.writeText).toHaveBeenCalledWith("/notes/existing.md", "updated");
    expect(lifecycle.snapshot).toMatchObject({ lastSavedContent: "updated", dirty: false });
  });

  it("uses Save As for untitled documents and updates identity after writing", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("new document");
    const fileServices = services({
      selectSavePath: vi.fn().mockResolvedValue("/notes/chosen.md"),
      writeText: vi.fn().mockResolvedValue(undefined),
    });

    await saveDocument(lifecycle, fileServices);
    expect(fileServices.selectSavePath).toHaveBeenCalledWith("Untitled.md");
    expect(fileServices.writeText).toHaveBeenCalledWith("/notes/chosen.md", "new document");
    expect(lifecycle.snapshot).toMatchObject({
      displayName: "chosen.md",
      filePath: "/notes/chosen.md",
      dirty: false,
    });
  });

  it("can Save As an existing document to a new identity", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "content", filePath: "/notes/old.md" });
    const fileServices = services({
      selectSavePath: vi.fn().mockResolvedValue("/notes/new.md"),
      writeText: vi.fn().mockResolvedValue(undefined),
    });

    await saveDocument(lifecycle, fileServices, { saveAs: true });
    expect(lifecycle.snapshot).toMatchObject({ displayName: "new.md", filePath: "/notes/new.md" });
  });

  it("preserves state when Save As is canceled", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("keep draft");
    const before = lifecycle.snapshot;

    await expect(saveDocument(lifecycle, services())).resolves.toEqual({
      status: "canceled",
      message: "Save canceled.",
    });
    expect(lifecycle.snapshot).toEqual(before);
  });

  it("preserves identity and dirty state and reports write failures", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "old", filePath: "/notes/existing.md" });
    lifecycle.edit("keep draft");
    const before = lifecycle.snapshot;
    const fileServices = services({ writeText: vi.fn().mockRejectedValue(new Error("disk full")) });

    await expect(saveDocument(lifecycle, fileServices)).resolves.toEqual({
      status: "failed",
      message: "Could not save existing.md: disk full",
    });
    expect(lifecycle.snapshot).toEqual(before);
  });

  it("leaves later edits dirty when an in-flight write succeeds", async () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "one", filePath: "/notes/existing.md" });
    lifecycle.edit("two");
    let finishWrite: (() => void) | undefined;
    const writePending = new Promise<void>((resolve) => (finishWrite = resolve));
    const savePending = saveDocument(lifecycle, services({ writeText: vi.fn(() => writePending) }));

    lifecycle.edit("three");
    finishWrite?.();
    await savePending;
    expect(lifecycle.snapshot).toMatchObject({ content: "three", lastSavedContent: "two", dirty: true });
  });
});
