import { afterEach, describe, expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import { completedFileEdit, completionContext, encodePathSegment } from "../src/path-completion-context";
import { installPathCompletion, type PathListing } from "../src/path-completion";
import "../shared/editor-behavior.js";

function context(text: string) {
  const caret = text.indexOf("|");
  return completionContext(text.replace("|", ""), caret);
}
describe("Markdown destination context", () => {
  it.each([
    ["[x](./ol|", "[x](./new.md)|"],
    ["[x](./ol|) after", "[x](./new.md)| after"],
    ["[x](./ol|#part)", "[x](./new.md#part)|"],
    ["[x](./ol|#part(one)) after", "[x](./new.md#part(one))| after"],
    ['[x](./ol| "Title ) here") after', '[x](./new.md "Title ) here")| after'],
    ["![x](<./ol|", "![x](<./new.md>)|"],
    ["![x](<./ol|>) after", "![x](<./new.md>)| after"],
    ['[x](<./ol|#part> "Title")', '[x](<./new.md#part> "Title")|'],
    ["[x](./ol| after", "[x](./new.md)| after"],
    ["[x](./ol| (Title)) after", "[x](./new.md (Title))| after"],
  ])("finishes %s without losing surrounding text", (input, expected) => {
    const source = input.replace("|", ""), value = context(input)!;
    const edit = completedFileEdit(source, value, "new.md");
    expect(source.slice(0, value.start) + edit.text + "|" + source.slice(edit.end)).toBe(expected);
  });
  it.each([
    ["[Guide](do|)", "", "do", false],
    ["![Image](images/ph|)", "images/", "ph", true],
    ["[Guide](../docs/|)", "../docs/", "", false],
    ["[Guide](<my folder/a b|>)", "my%20folder/", "a b", false],
    ["[Guide](my%20folder/Caf%C3%A9|)", "my%20folder/", "Café", false],
    ["[Guide](a\\(b|)", "", "a(b", false],
    ["[Guide](100%25|)", "", "100%", false],
    ["[**nested [text]**](fi|)", "", "fi", false],
    ["`[ignored](x)` [Guide](fi|)", "", "fi", false],
  ])("recognizes %s", (text, directory, prefix, image) => {
    expect(context(text as string)).toMatchObject({ directory, prefix, image });
  });
  it.each([
    "ordinary prose|", "[label|](docs/)", "[label][ref|]", "\\[label](do|)",
    "[Guide](https://example.co|)", "[Guide](//server/fi|)", "[Guide](/etc/fi|)",
    "[Guide](C:/fi|)", "[Guide](docs\\fi|)", "[Guide](%2Fetc/fi|)",
    "[Guide](file%3Afi|)", "[Guide](#hea|)", "[Guide](x.md#hea|)",
    "[Guide](x.md?que|)", '[Guide](x.md "ti|tle")', "[Guide](bad%2|)",
    "[Guide](x%00|)", "`[Guide](fi|)`", "```md\n[Guide](fi|)\n```",
    "~~~\n[Guide](fi|)", "    [Guide](fi|)", "\t[Guide](fi|)",
    "`code\n[Guide](fi|)\ncode`", "> ```\n> [Guide](fi|)\n> ```",
  ])("leaves %s alone", text => { expect(context(text)).toBeNull(); });
  it("replaces the whole destination while preserving a fragment or title", () => {
    for (const text of ['[Guide](do|cs/old.md "Title")', "[Guide](ol|d.md#section)"]) {
      const source = text.replace("|", "");
      const value = context(text)!;
      expect(source.slice(value.start, value.end)).toBe(text.includes("section") ? "old.md" : "docs/old.md");
    }
    expect(completionContext("[x](docs/)", 5, 7)).toBeNull();
  });
  it("resumes after a fence and safely encodes names for rendered links", () => {
    expect(context("```\ncode\n```\n[x](fi|)")?.prefix).toBe("fi");
    expect(context("`code\nend` [x](fi|)")?.prefix).toBe("fi");
    const name = "Café (100%) #1?.md";
    const encoded = encodePathSegment(name);
    const root = document.createElement("div");
    root.innerHTML = new MarkdownIt().render(`[x](${encoded})`);
    expect(decodeURIComponent(root.querySelector("a")!.getAttribute("href")!)).toBe(name);
  });
});

describe("path suggestion interaction", () => {
  const controllers: ReturnType<typeof installPathCompletion>[] = [];
  afterEach(() => {
    controllers.splice(0).forEach(controller => controller.destroy());
    document.body.replaceChildren(); vi.useRealTimers();
  });
  function setup(list = vi.fn(async (): Promise<PathListing> => ({ entries: [
    { name: "docs", kind: "directory" }, { name: "guide (new).md", kind: "document" },
  ], truncated: false }))) {
    vi.useFakeTimers();
    const panel = document.createElement("section"), editor = document.createElement("textarea");
    panel.append(editor); document.body.append(panel); editor.focus();
    let owner: { id: string; path: string } | null = { id: "a", path: "C:/one/source.md" };
    globalThis.QuickMarkEditor.installMarkdownEditorBehavior(editor);
    const controller = installPathCompletion(editor, { owner: () => owner, list });
    controllers.push(controller);
    function input(text = "[x](./|)") {
      editor.value = text.replace("|", ""); editor.setSelectionRange(text.indexOf("|"), text.indexOf("|"));
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function key(key: string, extra = {}) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...extra });
      editor.dispatchEvent(event); return event;
    }
    return { editor, panel, list, controller, input, key, owner: (next: typeof owner) => { owner = next; } };
  }
  it("navigates and accepts a filename without adding indentation or newline", async () => {
    const value = setup(); value.input(); await vi.advanceTimersByTimeAsync(110);
    expect(value.panel.querySelector('[role="listbox"]')?.children.length).toBe(2);
    expect(document.activeElement).toBe(value.editor);
    expect(value.key("ArrowDown").defaultPrevented).toBe(true);
    expect(value.panel.querySelector('[aria-selected="true"]')?.textContent).toContain("guide (new).md");
    expect(value.key("Enter").defaultPrevented).toBe(true);
    expect(value.editor.value).toBe("[x](./guide%20%28new%29.md)");
    expect(value.editor.selectionStart).toBe(value.editor.value.length);
    expect(value.editor.getAttribute("aria-activedescendant")).toBeNull();
  });
  it("accepts directories with Tab and requests the next level", async () => {
    const value = setup(); value.input(); await vi.advanceTimersByTimeAsync(110);
    value.key("Tab"); expect(value.editor.value).toBe("[x](./docs/)");
    expect(value.editor.selectionStart).toBe(value.editor.value.length - 1);
    await vi.advanceTimersByTimeAsync(110);
    expect(value.list).toHaveBeenLastCalledWith("C:/one/source.md", "./docs/", "", false);
  });
  it("supports pointer acceptance with editor focus retained", async () => {
    const value = setup(); value.input(); await vi.advanceTimersByTimeAsync(110);
    const option = value.panel.querySelector<HTMLElement>('[data-index="1"]')!;
    option.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
    option.click();
    expect(document.activeElement).toBe(value.editor);
    expect(value.editor.value).toContain("guide%20%28new%29.md");
  });
  it("retains Escape then Tab focus exit and ordinary indentation", async () => {
    const value = setup(); value.input(); await vi.advanceTimersByTimeAsync(110);
    value.key("Escape"); expect(value.key("Tab").defaultPrevented).toBe(false);
    value.input("text|"); value.key("Tab"); expect(value.editor.value).toBe("text    ");
    value.input("- item|"); value.key("Enter"); expect(value.editor.value).toBe("- item\n- ");
  });
  it.each(["tab", "path", "caret", "text", "blur", "readOnly"])("rejects late results after %s changes", async change => {
    let resolve!: (value: PathListing) => void;
    const value = setup(vi.fn(() => new Promise<PathListing>(done => { resolve = done; })));
    value.input(); await vi.advanceTimersByTimeAsync(110);
    if (change === "tab") value.owner({ id: "b", path: "C:/one/source.md" });
    if (change === "path") value.owner({ id: "a", path: "C:/two/source.md" });
    if (change === "caret") value.editor.setSelectionRange(0, 0);
    if (change === "text") value.editor.value = "different";
    if (change === "blur") value.editor.blur();
    if (change === "readOnly") value.editor.readOnly = true;
    resolve({ entries: [{ name: "wrong.md", kind: "document" }], truncated: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(value.panel.querySelector<HTMLElement>(".path-completion")!.hidden).toBe(true);
    expect(value.editor.value).not.toContain("wrong.md");
  });
  it("invalidates displayed suggestions before accepting after a tab switch", async () => {
    const value = setup(); value.input(); await vi.advanceTimersByTimeAsync(110);
    value.owner({ id: "b", path: "C:/two/source.md" }); value.key("Enter");
    expect(value.editor.value).toBe("[x](./)");
  });
  it("ignores out-of-order replies and Escape while loading", async () => {
    const replies: ((result: PathListing) => void)[] = [];
    const value = setup(vi.fn(() => new Promise<PathListing>(done => replies.push(done))));
    value.input(); await vi.advanceTimersByTimeAsync(110);
    value.input("[x](./ne|)"); await vi.advanceTimersByTimeAsync(110);
    replies[1]({ entries: [{ name: "new.md", kind: "document" }], truncated: false });
    replies[0]({ entries: [{ name: "old.md", kind: "document" }], truncated: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(value.panel.querySelector('[role="option"]')?.textContent).toBe("new.mddocument");
    value.input(); await vi.advanceTimersByTimeAsync(110); value.key("Escape");
    replies[2]({ entries: [{ name: "late.md", kind: "document" }], truncated: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(value.panel.querySelector<HTMLElement>(".path-completion")!.hidden).toBe(true);
  });
  it("stays unobtrusive for untitled documents, errors, empty results and IME", async () => {
    const value = setup(); value.owner(null); value.input(); await vi.advanceTimersByTimeAsync(110);
    expect(value.list).not.toHaveBeenCalled();
    value.owner({ id: "a", path: "C:/one/source.md" });
    value.list.mockRejectedValueOnce(new Error("Access denied")); value.input(); await vi.advanceTimersByTimeAsync(110);
    expect(value.panel.querySelector<HTMLElement>(".path-completion")!.hidden).toBe(true);
    value.list.mockResolvedValueOnce({ entries: [], truncated: false }); value.input(); await vi.advanceTimersByTimeAsync(110);
    expect(value.panel.querySelector<HTMLElement>(".path-completion")!.hidden).toBe(true);
    value.list.mockClear(); value.editor.dispatchEvent(new Event("compositionstart"));
    value.input(); await vi.advanceTimersByTimeAsync(110); expect(value.list).not.toHaveBeenCalled();
  });
  it.each(["", "h", "http", "https:", "https://example.com", "www.example.com", "docs/", "mailto:me@example.com"])("does not automatically suggest for %s", async prefix => {
    const value = setup(); value.input(`[x](${prefix}|)`); await vi.advanceTimersByTimeAsync(110);
    expect(value.list).not.toHaveBeenCalled();
  });
  it("requests bare filenames with Ctrl+Space and completes an unfinished link", async () => {
    const value = setup(); value.input("[x](gu|");
    expect(value.key(" ", { ctrlKey: true, code: "Space" }).defaultPrevented).toBe(true);
    await vi.advanceTimersByTimeAsync(110);
    value.key("ArrowDown"); value.key("Tab");
    expect(value.editor.value).toBe("[x](guide%20%28new%29.md)");
    expect(value.editor.selectionStart).toBe(value.editor.value.length);
    value.input("[x](https://example.com|)"); value.key(" ", { ctrlKey: true, code: "Space" });
    await vi.advanceTimersByTimeAsync(110);
    expect(value.list).toHaveBeenCalledTimes(1);
  });
  it("continues browsing a manually requested directory without closing the link", async () => {
    const value = setup(); value.input("[x](|"); value.key(" ", { ctrlKey: true });
    await vi.advanceTimersByTimeAsync(110); value.key("Tab");
    expect(value.editor.value).toBe("[x](docs/");
    await vi.advanceTimersByTimeAsync(110);
    expect(value.list).toHaveBeenLastCalledWith("C:/one/source.md", "docs/", "", false);
  });
  it("keeps explicit suggestions while narrowing and cancels them on Escape", async () => {
    const value = setup(); value.input("[x](g|)"); value.key(" ", { ctrlKey: true });
    await vi.advanceTimersByTimeAsync(110);
    value.key("u"); value.input("[x](gu|)"); await vi.advanceTimersByTimeAsync(110);
    expect(value.list).toHaveBeenLastCalledWith("C:/one/source.md", ".", "gu", false);
    value.key("Escape"); value.input("[x](gui|)"); await vi.advanceTimersByTimeAsync(110);
    expect(value.list).toHaveBeenCalledTimes(2);
  });
  it("keeps an explicit document empty state open and recovers when widened", async () => {
    const list = vi.fn(async (_path: string, _directory: string, prefix: string): Promise<PathListing> => ({
      entries: prefix === "zzz" ? [] : [{ name: "zz-guide.md", kind: "document" }], truncated: false,
    }));
    const value = setup(list); value.input("[x](zzz|"); value.key(" ", { ctrlKey: true });
    await vi.advanceTimersByTimeAsync(110);
    expect(value.panel.querySelector(".path-completion__empty")?.textContent)
      .toBe("No matching document or folder names found.");
    expect(value.panel.querySelector<HTMLElement>(".path-completion")!.hidden).toBe(false);
    expect(value.editor.getAttribute("aria-activedescendant")).toBeNull();
    value.key("Backspace"); value.input("[x](zz|"); await vi.advanceTimersByTimeAsync(110);
    expect(value.panel.querySelector('[role="option"]')?.textContent).toBe("zz-guide.mddocument");
    expect(list).toHaveBeenCalledTimes(2);
  });
  it("describes an empty explicit image search", async () => {
    const value = setup(vi.fn(async () => ({ entries: [], truncated: false })));
    value.input("![x](missing|"); value.key(" ", { ctrlKey: true });
    await vi.advanceTimersByTimeAsync(110);
    expect(value.panel.querySelector(".path-completion__empty")?.textContent)
      .toBe("No matching image or folder names found.");
  });
});
