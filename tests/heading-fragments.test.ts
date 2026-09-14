import { beforeEach, describe, expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import { readFileSync } from "node:fs";
import "../shared/markdown-renderer.js";
import { lintSource } from "../src/lint-profile";
import { installRenderedResourceController } from "../src/rendered-resources";
import { createScrollSyncController } from "../src/scroll-sync";
import { renderCheatSheet } from "../src/cheat-sheet-renderer";

const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const fragments = (source: string) => lintSource(source).filter(issue => issue.rule === "MD051");
function preview(source: string) {
  const root = document.createElement("div");
  root.innerHTML = renderer.render(source, { sourceMap: true });
  document.body.append(root);
  return root;
}
function control(root: HTMLElement) {
  const report = vi.fn(); const openExternal = vi.fn(); const openRelativeDocument = vi.fn();
  const controller = installRenderedResourceController(root, {
    getDocumentPath: () => null, openExternal, openRelativeDocument,
    resolveDocumentLink: vi.fn(), readLocalImage: vi.fn(), report,
  });
  return { ...controller, report, openExternal, openRelativeDocument };
}
function activate(link: HTMLAnchorElement, type = "click") {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, detail: 0 });
  link.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
}

describe("shared heading/fragment contract", () => {
  beforeEach(() => document.body.replaceChildren());

  it("keeps the native fixture's expected failures and bundled example links accurate", () => {
    expect(fragments(readFileSync("tests/manual/heading-fragments.md", "utf8")).map(issue => issue.context))
      .toEqual(["#missing", "#custom", "#raw", "#L20", "#top"]);
    expect(fragments(readFileSync("src/markdown-examples.md", "utf8"))).toEqual([]);
  });

  it("uses inline text, normalized Unicode, punctuation removal and deterministic collision handling", () => {
    const source = ["# Getting **Started!**", "## Getting Started", "## Getting Started-1",
      "## Getting Started", "## `Code` and [Label](https://example.com) ![Alt *text*](image.png)",
      "## Cafe\u0301 中文 _works_ x_y", "## !!!", "## ???", "## section", "Setext &amp; More\n---"].join("\n\n");
    const expected = ["getting-started", "getting-started-1", "getting-started-1-1", "getting-started-2",
      "code-and-label-alt-text", "café-中文-works-x_y", "section", "section-1", "section-2", "setext-more"];
    const root = preview(source);
    expect([...root.querySelectorAll("[data-heading-anchor]")].map(h => h.id)).toEqual(expected);
    expect(root.querySelector("h2")?.getAttribute("data-source-line")).toBe("2");
    expect(renderer.render(source)).toBe(renderer.render(source));
    expect(preview("# Getting Started").querySelector("h1")?.id).toBe("getting-started");
    expect(fragments(source + "\n\n" + expected.map(id => `[go](#${encodeURIComponent(id)})`).join(" "))).toEqual([]);
  });

  it("validates actual rendered inline/reference links, including Unicode and top boundaries", () => {
    const source = "# Café\r\n\r\n[encoded](#caf%C3%A9) [unicode](#café) [start](#) [ref][section]\r\n\r\n[section]: #café\r\n\r\n" +
      "[missing](#missing) [case](#Caf%C3%A9) [top](#top) [line](#L20) [range](#L19C5-L21C11) [bad](#%FF) [once](#caf%25C3%25A9)\r\n";
    expect(fragments(source).map(issue => issue.context)).toEqual([
      "#missing", "#Caf%C3%A9", "#top", "#L20", "#L19C5-L21C11", "#%FF", "#caf%25C3%25A9",
    ]);
    expect(fragments(source).every(issue => issue.line === 7 && issue.column === null)).toBe(true);
    expect(fragments("# Top\n\n[top](#top)\n")).toEqual([]);
    expect(fragments("# Before\n\n[go](#before)\n")).toEqual([]);
    expect(fragments("# After\n\n[go](#before)\n")).toHaveLength(1);
    expect(fragments("# Title\n\n[missing][ref]\n\n[ref]: #absent\n")[0].line).toBe(3);
  });

  it("does not invent targets from explicit attributes, raw HTML or code examples", () => {
    const source = '# Title {#custom}\n\n<a id="raw"></a>\n\n[custom](#custom) [html](#raw)\n\n' +
      '`[code](#missing)`\n\n```md\n# Hidden\n[code](#missing)\n```\n\n' +
      '    # Indented\n    [code](#missing)\n\n' +
      '<a href="#ignored">literal</a>\n\n![alt](#image) [external](https://example.com/#other) [file](other.md#other)\n';
    expect(fragments(source).map(issue => issue.context)).toEqual(["#custom", "#raw"]);
    const root = preview(source);
    expect([...root.querySelectorAll("[data-heading-anchor]")].map(h => h.id)).toEqual(["title-custom"]);
    expect(root.querySelector("#raw")).toBeNull();
    expect(root.textContent).toContain('<a id=“raw”>');
  });

  it("navigates only the clicked preview, supports keyboard/aux activation and rechecks rerenders", () => {
    const other = preview("# Café\n\n[go](#café)"); other.scrollTop = 77;
    const root = preview("# Café\n\n[go](#caf%C3%A9) [top](#) [missing](#missing) [bad](#%FF)");
    const controller = control(root);
    const links = root.querySelectorAll<HTMLAnchorElement>("a");
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
    vi.spyOn(root.querySelector("h1")!, "getBoundingClientRect").mockReturnValue({ top: 300 } as DOMRect);
    activate(links[0]); expect(root.scrollTop).toBe(200); expect(other.scrollTop).toBe(77);
    activate(links[1]); expect(root.scrollTop).toBe(0);
    activate(links[0], "auxclick"); expect(root.scrollTop).toBe(200);
    activate(links[2]); activate(links[3]); expect(controller.report).toHaveBeenCalledTimes(2);
    root.innerHTML = renderer.render("# Renamed\n\n[old](#café)"); controller.refresh();
    activate(root.querySelector("a")!); expect(controller.report).toHaveBeenCalledTimes(3);
    expect(other.scrollTop).toBe(77);
    expect(controller.openExternal).not.toHaveBeenCalled(); expect(controller.openRelativeDocument).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("isolates Cheat Sheet example documents from the surrounding guide", () => {
    const root = document.createElement("div");
    root.innerHTML = renderCheatSheet("# Same\n\n[guide](#same) [not in guide](#example-only)\n\n```md\n# Same\n\n[example](#same) [top](#)\n\n## Example only\n```", renderer);
    document.body.append(root);
    const controller = control(root);
    const example = root.querySelector<HTMLElement>("[data-markdown-document]")!;
    vi.spyOn(root.querySelector("h1")!, "getBoundingClientRect").mockReturnValue({ top: 50 } as DOMRect);
    vi.spyOn(example.querySelector("h1")!, "getBoundingClientRect").mockReturnValue({ top: 300 } as DOMRect);
    vi.spyOn(example, "getBoundingClientRect").mockReturnValue({ top: 200 } as DOMRect);
    activate(example.querySelector("a")!); expect(root.scrollTop).toBe(300);
    root.scrollTop = 0;
    activate(root.querySelector("a")!); expect(root.scrollTop).toBe(50);
    root.scrollTop = 0;
    activate(example.querySelectorAll("a")[1]); expect(root.scrollTop).toBe(200);
    activate(root.querySelectorAll("a")[1]); expect(controller.report).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it.each([true, false])("preserves source selection and follows the existing sync setting (%s)", enabled => {
    const root = preview("# Target\n\n[go](#target)"); const editor = document.createElement("textarea");
    editor.value = "unchanged source"; editor.setSelectionRange(2, 5);
    const controller = control(root);
    const frames: FrameRequestCallback[] = [];
    const sync = createScrollSyncController({ editor, preview: root, getSource: () => editor.value,
      measure: () => ({ sourceExtent: 1000, targetExtent: 1000, points: [{ source: 0, target: 0 }, { source: 1000, target: 1000 }] }),
      scheduleFrame: callback => { frames.push(callback); return frames.length; }, cancelFrame: vi.fn() });
    const flush = () => { while (frames.length) frames.shift()!(0); };
    sync.setActive(enabled); flush();
    vi.spyOn(root.querySelector("h1")!, "getBoundingClientRect").mockReturnValue({ top: 500 } as DOMRect);
    activate(root.querySelector("a")!); root.dispatchEvent(new Event("scroll")); flush();
    expect(root.scrollTop).toBe(500); expect(editor.scrollTop).toBe(enabled ? 500 : 0);
    expect(editor.value).toBe("unchanged source"); expect(editor.selectionStart).toBe(2); expect(editor.selectionEnd).toBe(5);
    sync.destroy(); controller.dispose();
  });
});
