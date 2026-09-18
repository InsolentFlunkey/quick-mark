import { describe, expect, it, vi } from "vitest";
import { installDialogFieldHistory } from "../src/dialog-field-history";

function type(field: HTMLInputElement, value: string) {
  field.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText" }));
  field.value = value;
  field.setSelectionRange(value.length, value.length);
  field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
}

function shortcut(target: Element, key: string, shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key, ctrlKey: true, shiftKey, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe("modal dialog field history boundary", () => {
  it("undoes and redoes field edits without crossing an exhausted boundary", () => {
    document.body.innerHTML = '<div id="editor">document</div><dialog open><input id="header" value="A"></dialog>';
    const dispose = installDialogFieldHistory(document);
    const field = document.querySelector<HTMLInputElement>("#header")!;
    const escaped = vi.fn(); document.addEventListener("keydown", escaped);
    field.focus(); type(field, "AB"); type(field, "ABC");

    expect(shortcut(field, "z").defaultPrevented).toBe(true); expect(field.value).toBe("AB");
    expect(shortcut(field, "z").defaultPrevented).toBe(true); expect(field.value).toBe("A");
    expect(shortcut(field, "z").defaultPrevented).toBe(true); expect(field.value).toBe("A");
    expect(shortcut(field, "y").defaultPrevented).toBe(true); expect(field.value).toBe("AB");
    expect(shortcut(field, "z", true).defaultPrevented).toBe(true); expect(field.value).toBe("ABC");
    expect(escaped).not.toHaveBeenCalled();
    document.removeEventListener("keydown", escaped);
    dispose();
  });

  it("discards field Redo after a new edit and consumes shortcuts on non-editable modal controls", () => {
    document.body.innerHTML = '<input id="outside"><dialog open><input id="header" value="A"><button id="button">Done</button></dialog>';
    const dispose = installDialogFieldHistory(document);
    const field = document.querySelector<HTMLInputElement>("#header")!;
    type(field, "AB"); type(field, "ABC"); shortcut(field, "z");
    type(field, "ABX"); shortcut(field, "y"); expect(field.value).toBe("ABX");
    expect(shortcut(document.querySelector("#button")!, "z").defaultPrevented).toBe(true);
    expect(shortcut(document.querySelector("#outside")!, "z").defaultPrevented).toBe(false);
    dispose();
  });
});
