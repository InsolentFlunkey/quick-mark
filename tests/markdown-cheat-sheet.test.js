import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import "../shared/markdown-renderer.js";

const source = readFileSync("src/markdown-cheat-sheet.md", "utf8");
const renderer = () => globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
function render(text) {
  const element = document.createElement("div");
  element.innerHTML = renderer().render(text);
  return element;
}
const examples = new MarkdownIt().parse(source, {}).filter(token => token.type === "fence");
function example(section) {
  const tokens = new MarkdownIt().parse(source, {});
  const start = tokens.findIndex((token, index) => token.type === "heading_open" && token.tag === "h2" && tokens[index + 1].content === section);
  expect(start).toBeGreaterThan(-1);
  const result = [];
  for (let index = start + 3; index < tokens.length; index++) {
    if (tokens[index].type === "heading_open" && tokens[index].tag === "h2") break;
    if (tokens[index].type === "fence") result.push(tokens[index].content);
  }
  return result.join("\n\n");
}

describe("original QuickMark cheat sheet", () => {
  it("gives every source example the shared accessible Copy interaction without loading images", async () => {
    const output = render(source); document.body.append(output);
    expect(output.querySelectorAll("img")).toHaveLength(0);
    const buttons = [...output.querySelectorAll(".copy-btn")];
    expect(buttons.length).toBe(examples.length); expect(buttons.length).toBeGreaterThan(15);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const notify = vi.fn(); const cleanup = globalThis.QuickMarkMarkdown.installCodeCopyHandler(output, notify);
    try {
      for (const [index, button] of buttons.entries()) {
        expect(button.getAttribute("aria-label")).toBeTruthy();
        button.click();
        await vi.waitFor(() => {
          expect(writeText).toHaveBeenLastCalledWith(examples[index].content.replace(/\s*\n$/, ""));
          expect(button.dataset.copyState).toBe("copied");
        });
      }
      expect(notify).toHaveBeenCalledWith("Copied to clipboard.");
    } finally { cleanup(); output.remove(); }
  });
  it("demonstrates supported block and inline syntax with actual renderer results", () => {
    const headings = render(example("Headings"));
    for (let level = 1; level <= 6; level++) expect(headings.querySelector(`h${level}`)).not.toBeNull();
    expect(headings.querySelectorAll("h1")).toHaveLength(2);
    const emphasis = render(example("Emphasis and strikethrough"));
    for (const tag of ["em", "strong", "s"]) expect(emphasis.querySelector(tag)).not.toBeNull();
    expect(render(example("Blockquotes")).querySelector("blockquote blockquote")).not.toBeNull();
    const lists = render(example("Unordered and ordered lists"));
    expect(lists.querySelector("ul ul")).not.toBeNull(); expect(lists.querySelector("ol")?.getAttribute("start")).toBe("3");
    expect(render(example("Thematic breaks")).querySelector("hr")).not.toBeNull();
    expect(render(example("Paragraphs and line breaks")).querySelectorAll("br")).toHaveLength(1);
    const table = render(example("Tables"));
    expect(table.querySelectorAll("th")).toHaveLength(3); expect(table.textContent).toContain("A | B");
    expect(table.querySelector("code")?.textContent).toBe("x|y");
    expect(render(example("Fenced and indented code blocks")).querySelectorAll(".copy-btn")).toHaveLength(3);
    expect(render(example("Inline code, escapes, and entities")).textContent).toContain("a `backtick` inside code");
    expect(render(example("Typography")).textContent).toContain("©");
  });
  it("shows supported link and image destinations and explains saved-file context", () => {
    const web = render(example("Web links and email"));
    for (const destination of ["https://example.com", "http://example.com", "mailto:team@example.com"]) {
      expect(web.querySelector(`a[href="${destination}"]`)).not.toBeNull();
    }
    expect(render(example("Reference links")).querySelectorAll("a")).toHaveLength(3);
    expect(render(example("Relative document links")).querySelectorAll("a")).toHaveLength(5);
    const images = render(example("Images"));
    expect(images.querySelectorAll("img")).toHaveLength(4);
    expect(source).toContain("**Save your main document first.**");
    expect(source).toContain("10 MiB");
    expect(source).toContain("This bundled cheat sheet has no filesystem folder");
  });
  it("separates current optional omissions from safety restrictions", () => {
    const optional = render(example("Currently unsupported optional syntax"));
    expect(optional.querySelector('input, dl, math, svg:not(.copy-btn svg)')).toBeNull();
    expect(optional.querySelector("code.language-mermaid")).not.toBeNull();
    expect(optional.querySelector("h2")?.id).toBe("");
    const restricted = render(example("Deliberate safety restrictions"));
    expect(restricted.querySelector("strong")).toBeNull();
    expect(restricted.textContent).toContain("<strong>");
    expect(source).toContain("current limitations, not permanent exclusions");
    expect(source).toContain("original QuickMark documentation");
  });
});
