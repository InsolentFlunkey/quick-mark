import { describe, expect, it } from "vitest";
import { DocumentLifecycle, UNTITLED_DOCUMENT_NAME } from "../src/document-lifecycle";

describe("document lifecycle state", () => {
  it("starts as a clean untitled document with no filesystem identity", () => {
    const lifecycle = new DocumentLifecycle();
    expect(lifecycle.snapshot).toMatchObject({
      content: "",
      displayName: UNTITLED_DOCUMENT_NAME,
      filePath: null,
      lastSavedContent: "",
      dirty: false,
    });
    expect(Object.isFrozen(lifecycle.snapshot)).toBe(true);
  });

  it("derives dirty state from edits and the saved baseline", () => {
    const lifecycle = new DocumentLifecycle();
    expect(lifecycle.edit("draft").dirty).toBe(true);
    expect(lifecycle.edit("").dirty).toBe(false);

    lifecycle.applyLoadResult({ status: "success", content: "saved", filePath: "/notes/saved.md" });
    expect(lifecycle.edit("changed").dirty).toBe(true);
    expect(lifecycle.edit("saved").dirty).toBe(false);
  });

  it("treats clear as an edit and new as a clean identity reset", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "saved", filePath: "/notes/saved.md" });
    expect(lifecycle.clear()).toMatchObject({ content: "", lastSavedContent: "saved", dirty: true });

    expect(lifecycle.newDocument()).toMatchObject({
      content: "",
      displayName: UNTITLED_DOCUMENT_NAME,
      filePath: null,
      lastSavedContent: "",
      dirty: false,
    });
  });
});

describe("document load results", () => {
  it("loads a bundled sample without giving it a filesystem identity", () => {
    const lifecycle = new DocumentLifecycle();
    expect(lifecycle.loadBundledSample("# QuickMark")).toMatchObject({
      content: "# QuickMark",
      displayName: "README.md",
      filePath: null,
      lastSavedContent: "# QuickMark",
      dirty: false,
    });
    expect(lifecycle.createSaveRequest()).toMatchObject({ kind: "save-as", suggestedName: "README.md" });
  });

  it("loads content and derives a display name from portable path formats", () => {
    const lifecycle = new DocumentLifecycle();
    expect(
      lifecycle.applyLoadResult({ status: "success", content: "# Loaded", filePath: "C:\\docs\\loaded.md" }),
    ).toMatchObject({
      content: "# Loaded",
      displayName: "loaded.md",
      filePath: "C:\\docs\\loaded.md",
      lastSavedContent: "# Loaded",
      dirty: false,
    });
  });

  it.each([{ status: "canceled" as const }, { status: "failed" as const, error: new Error("read failed") }])(
    "does not mutate state for a $status load",
    (result) => {
      const lifecycle = new DocumentLifecycle();
      lifecycle.edit("keep me");
      const before = lifecycle.snapshot;
      expect(lifecycle.applyLoadResult(result)).toEqual(before);
    },
  );
});

describe("document save transitions", () => {
  it("requests Save As with a predictable name for an untitled document", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("draft");
    expect(lifecycle.createSaveRequest()).toMatchObject({
      kind: "save-as",
      content: "draft",
      filePath: null,
      suggestedName: UNTITLED_DOCUMENT_NAME,
    });
  });

  it("requests Save to the existing path and can explicitly request Save As", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "saved", filePath: "/notes/existing.md" });
    lifecycle.edit("changed");
    expect(lifecycle.createSaveRequest()).toMatchObject({
      kind: "save",
      content: "changed",
      filePath: "/notes/existing.md",
      suggestedName: "existing.md",
    });
    expect(lifecycle.createSaveRequest({ saveAs: true })).toMatchObject({ kind: "save-as", filePath: null });
  });

  it("updates identity and saved state only after a successful Save As", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("draft");
    const request = lifecycle.createSaveRequest();
    expect(lifecycle.applySaveResult(request, { status: "success", filePath: "/notes/renamed.md" })).toMatchObject({
      content: "draft",
      displayName: "renamed.md",
      filePath: "/notes/renamed.md",
      lastSavedContent: "draft",
      dirty: false,
    });
  });

  it.each([{ status: "canceled" as const }, { status: "failed" as const, error: new Error("write failed") }])(
    "preserves identity and dirty state after a $status save",
    (result) => {
      const lifecycle = new DocumentLifecycle();
      lifecycle.applyLoadResult({ status: "success", content: "saved", filePath: "/notes/existing.md" });
      lifecycle.edit("changed");
      const request = lifecycle.createSaveRequest();
      const before = lifecycle.snapshot;
      expect(lifecycle.applySaveResult(request, result)).toEqual(before);
    },
  );

  it("keeps edits made during a save dirty after that save succeeds", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "one", filePath: "/notes/existing.md" });
    lifecycle.edit("two");
    const request = lifecycle.createSaveRequest();
    lifecycle.edit("three");
    expect(lifecycle.applySaveResult(request, { status: "success" })).toMatchObject({
      content: "three",
      lastSavedContent: "two",
      dirty: true,
    });
  });

  it("ignores a stale save completion after switching documents", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("old draft");
    const staleRequest = lifecycle.createSaveRequest();
    lifecycle.applyLoadResult({ status: "success", content: "new file", filePath: "/notes/new.md" });
    const before = lifecycle.snapshot;
    expect(
      lifecycle.applySaveResult(staleRequest, { status: "success", filePath: "/notes/old.md" }),
    ).toEqual(before);
  });

  it("requires a filesystem path before completing Save As", () => {
    const lifecycle = new DocumentLifecycle();
    const request = lifecycle.createSaveRequest();
    expect(() => lifecycle.applySaveResult(request, { status: "success" })).toThrow(/file path/i);
    expect(lifecycle.snapshot.filePath).toBeNull();
  });
});
