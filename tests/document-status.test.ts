import { describe, expect, it } from "vitest";
import { DocumentLifecycle } from "../src/document-lifecycle";
import { formatDocumentStatus } from "../src/document-status";

describe("document status formatting", () => {
  it("shows the expected identity and state for a new document", () => {
    const lifecycle = new DocumentLifecycle();

    expect(formatDocumentStatus(lifecycle.snapshot)).toBe("Untitled — New document");
  });

  it.each([
    "/home/user/Documents/project/notes.md",
    "C:\\Users\\User\\Documents\\project\\notes.md",
  ])("preserves the complete platform-native path for %s", (filePath) => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({ status: "success", content: "saved", filePath });

    expect(formatDocumentStatus(lifecycle.snapshot)).toBe(`${filePath} — Saved`);
  });

  it("updates the path after a successful Save As identity transition", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.edit("draft");
    const request = lifecycle.createSaveRequest();

    lifecycle.applySaveResult(request, {
      status: "success",
      filePath: "/home/user/Documents/saved-as.md",
    });

    expect(formatDocumentStatus(lifecycle.snapshot)).toBe(
      "/home/user/Documents/saved-as.md — Saved",
    );
  });

  it("keeps the same full path across dirty and successful Save transitions", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({
      status: "success",
      content: "saved",
      filePath: "/home/user/Documents/existing.md",
    });
    lifecycle.edit("changed");

    expect(formatDocumentStatus(lifecycle.snapshot)).toBe(
      "/home/user/Documents/existing.md — Unsaved changes",
    );
    const request = lifecycle.createSaveRequest();
    lifecycle.applySaveResult(request, { status: "success" });
    expect(formatDocumentStatus(lifecycle.snapshot)).toBe(
      "/home/user/Documents/existing.md — Saved",
    );
  });

  it("keeps dirty and read-only state wording accurate alongside the path", () => {
    const lifecycle = new DocumentLifecycle();
    lifecycle.applyLoadResult({
      status: "success",
      content: "saved",
      filePath: "/shared/reference.md",
      writable: false,
    });

    expect(formatDocumentStatus(lifecycle.snapshot)).toBe("/shared/reference.md — Read-only");
    lifecycle.edit("changed");
    expect(formatDocumentStatus(lifecycle.snapshot)).toBe(
      "/shared/reference.md — Unsaved changes",
    );
  });
});
