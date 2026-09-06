import { expect, it, vi } from "vitest";
import { createDocumentTabs, type DocumentTab } from "../src/document-tabs";
it("labels duplicate filenames/dirty state and supports roving keyboard focus and targeted close", () => {
  const root = document.createElement("div"); document.body.append(root);
  const data: DocumentTab[] = [{ id: "a", name: "notes.md", path: "/a/notes.md", dirty: true }, { id: "b", name: "notes.md", path: "/b/notes.md", dirty: false }];
  const close = vi.fn(); const select = vi.fn((id: string) => controller.render(data, id));
  const controller = createDocumentTabs(root, select, close); controller.render(data, "a");
  const a = root.querySelector<HTMLButtonElement>('[role="tab"][data-document="a"]')!;
  expect(a.getAttribute("aria-label")).toBe("/a/notes.md, unsaved changes"); expect(a.tabIndex).toBe(0);
  a.focus(); a.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const b = root.querySelector<HTMLButtonElement>('[role="tab"][data-document="b"]')!;
  expect(select).toHaveBeenCalledWith("b"); expect(document.activeElement).toBe(b); expect(a.tabIndex).toBe(-1);
  b.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true })); expect(close).toHaveBeenCalledWith("b");
  root.querySelector<HTMLButtonElement>('[data-close][data-document="a"]')!.click(); expect(close).toHaveBeenLastCalledWith("a");
  controller.render([data[1]], "b"); expect(root.querySelectorAll('[role="tab"]')).toHaveLength(1); root.remove();
});
