import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../shared/editor-behavior.js";

let editor;
let removeBehavior;

function select(start, end = start) {
  editor.setSelectionRange(start, end);
}

function press(key, options = {}) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
  editor.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  editor = document.createElement("textarea");
  document.body.appendChild(editor);
  removeBehavior = globalThis.QuickMarkEditor.installMarkdownEditorBehavior(editor);
});

afterEach(() => {
  removeBehavior();
  editor.remove();
});

describe("shared Markdown editor indentation", () => {
  it("inserts four spaces at a cursor and indents a partially selected line", () => {
    editor.value = "alpha";
    select(2);
    expect(press("Tab").defaultPrevented).toBe(true);
    expect(editor.value).toBe("al    pha");
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([6, 6]);

    editor.value = "replace me";
    select(0, 7);
    press("Tab");
    expect(editor.value).toBe("    replace me");
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([0, 14]);
  });

  it("outdents up to four spaces from the current line and keeps the cursor valid", () => {
    editor.value = "first\n   second";
    select(12);
    press("Tab", { shiftKey: true });
    expect(editor.value).toBe("first\nsecond");
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([9, 9]);

    editor.value = "plain";
    select(2);
    const input = vi.fn();
    editor.addEventListener("input", input);
    press("Tab", { shiftKey: true });
    expect(editor.value).toBe("plain");
    expect(input).not.toHaveBeenCalled();
  });

  it("indents and outdents every line touched by a multiline selection", () => {
    editor.value = "before\n- alpha\n  - beta\n- gamma\nafter";
    select(8, 31);
    press("Tab");
    expect(editor.value).toBe("before\n    - alpha\n      - beta\n    - gamma\nafter");
    expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe(
      "    - alpha\n      - beta\n    - gamma",
    );

    press("Tab", { shiftKey: true });
    expect(editor.value).toBe("before\n- alpha\n  - beta\n- gamma\nafter");
  });

  it("preserves the legacy trailing-newline selection boundary", () => {
    editor.value = "one\ntwo\nthree";
    select(0, 4);
    press("Tab");
    expect(editor.value).toBe("    one\n    two\nthree");
  });

  it("indents list markers when the cursor is within their prefix", () => {
    editor.value = "- item\n7. ordered";
    select(2);
    press("Tab");
    expect(editor.value).toBe("    - item\n7. ordered");
    expect(editor.selectionStart).toBe(6);

    select(editor.value.indexOf("7.") + 3);
    press("Tab");
    expect(editor.value).toBe("    - item\n    1. ordered");
  });
});

describe("shared Markdown editor list continuation", () => {
  it.each(["- ", "* ", "+ "])("continues an unordered %s marker", (marker) => {
    editor.value = `${marker}item`;
    select(editor.value.length);
    press("Enter");
    expect(editor.value).toBe(`${marker}item\n${marker}`);
  });

  it("continues indentation and renumbers ordered lists", () => {
    editor.value = "    9. item";
    select(editor.value.length);
    press("Enter");
    expect(editor.value).toBe("    9. item\n    10. ");
  });

  it.each(["- ", "    + ", "12. "])("terminates a blank list item for %s", (line) => {
    editor.value = `previous\n${line}`;
    select(editor.value.length);
    press("Enter");
    expect(editor.value).toBe("previous\n\n");
    expect(editor.selectionStart).toBe(editor.value.length);
  });

  it("leaves ordinary Enter presses and modified shortcuts to native handling", () => {
    editor.value = "ordinary text";
    select(editor.value.length);
    expect(press("Enter").defaultPrevented).toBe(false);
    expect(press("Enter", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press("Tab", { altKey: true }).defaultPrevented).toBe(false);
    expect(editor.value).toBe("ordinary text");
  });
});

describe("shared Markdown editor integration", () => {
  it("dispatches a bubbling input event after an edit", () => {
    editor.value = "- item";
    select(editor.value.length);
    const localInput = vi.fn();
    const bubbledInput = vi.fn();
    editor.addEventListener("input", localInput);
    document.body.addEventListener("input", bubbledInput, { once: true });
    press("Enter");
    expect(localInput).toHaveBeenCalledOnce();
    expect(bubbledInput).toHaveBeenCalledOnce();
  });

  it("returns cleanup that restores native key handling", () => {
    removeBehavior();
    editor.value = "item";
    select(2);
    expect(press("Tab").defaultPrevented).toBe(false);
    expect(editor.value).toBe("item");
    removeBehavior = () => {};
  });

  it("lets the next Tab use native focus navigation after Escape", () => {
    editor.value = "item";
    select(2);
    expect(press("Escape").defaultPrevented).toBe(false);
    expect(press("Tab").defaultPrevented).toBe(false);
    expect(editor.value).toBe("item");

    expect(press("Tab").defaultPrevented).toBe(true);
    expect(editor.value).toBe("it    em");
  });
});


describe("native WebKitGTK Tab mapping", () => {
  it.each([false, true])("outdents native Shift+Tab with selection=%s and retains focus", (selected) => {
    editor.value = "    - first\n    - second";
    editor.focus();
    select(selected ? 0 : editor.value.length, editor.value.length);
    const event = press("Unidentified", { code: "Tab", shiftKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(editor.value).toBe(selected ? "- first\n- second" : "    - first\n- second");
    expect(document.activeElement).toBe(editor);
  });

  it("keeps focus on unindented text and ignores unrelated unidentified keys", () => {
    editor.value = "- item";
    editor.focus(); select(6);
    expect(press("Unidentified", { code: "Tab", shiftKey: true }).defaultPrevented).toBe(true);
    expect(press("Unidentified", { code: "KeyA", shiftKey: true }).defaultPrevented).toBe(false);
    expect(editor.value).toBe("- item");
    expect(document.activeElement).toBe(editor);
  });

  it.each(["Tab", "Unidentified"])("lets Escape then Shift then %s navigate once", (key) => {
    editor.value = "    - item"; select(10);
    press("Escape"); press("Shift", { shiftKey: true });
    expect(press(key, { code: "Tab", shiftKey: true }).defaultPrevented).toBe(false);
    expect(editor.value).toBe("    - item");
    expect(press(key, { code: "Tab", shiftKey: true }).defaultPrevented).toBe(true);
    expect(editor.value).toBe("- item");
  });

  it("does not retain an unused escape after leaving and returning to the editor", () => {
    editor.value = "    - item"; editor.focus(); select(10);
    press("Escape"); editor.blur(); editor.focus();
    expect(press("Unidentified", { code: "Tab", shiftKey: true }).defaultPrevented).toBe(true);
    expect(editor.value).toBe("- item");
  });
});
