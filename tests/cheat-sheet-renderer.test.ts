import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import "../shared/markdown-renderer.js";
import { renderCheatSheet } from "../src/cheat-sheet-renderer";

it("pairs every original source block with its actual rendered result exactly once", () => {
  const source = readFileSync("src/markdown-cheat-sheet.md", "utf8");
  const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
  const original = document.createElement("div"); original.innerHTML = renderer.render(source);
  const output = document.createElement("div"); output.innerHTML = renderCheatSheet(source, renderer);
  const blocks = [...original.querySelectorAll(".codeblock pre code")];
  const pairs = [...output.querySelectorAll(".cheat-sheet-example")];
  expect(pairs).toHaveLength(blocks.length);
  for (const [index, pair] of pairs.entries()) {
    expect(pair.querySelector(":scope > .codeblock pre code")?.textContent).toBe(blocks[index].textContent);
    expect(pair.querySelector(":scope > .codeblock .copy-btn")).not.toBeNull();
    const expected = document.createElement("div"); expected.innerHTML = renderer.render(blocks[index].textContent!);
    expect(pair.querySelector(".cheat-sheet-example__result")?.innerHTML).toBe(expected.innerHTML);
    expect(pair.querySelector('[role="region"]')?.getAttribute("aria-labelledby")).toBe(`cheat-sheet-result-${index + 1}`);
  }
  expect(output.querySelector(".cheat-sheet-example__result table")).not.toBeNull();
  expect(output.querySelector(".cheat-sheet-example__result strong")).not.toBeNull();
  expect(output.querySelector(".cheat-sheet-example__result code.language-mermaid")).not.toBeNull();
  expect(output.querySelector(".cheat-sheet-example__result .copy-btn")).not.toBeNull();
  expect(output.querySelector(".cheat-sheet-example__result .cheat-sheet-example")).toBeNull();
  expect(output.querySelector('input[type="checkbox"], script')).toBeNull();
  expect(output.querySelectorAll(".cheat-sheet-example__result img")).toHaveLength(4);
});
