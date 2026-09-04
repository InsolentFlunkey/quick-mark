import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import "../shared/markdown-renderer.js";

const projectRoot = process.cwd();
const fixtureDirectory = resolve(projectRoot, "test-files");
const readFixture = (name) => readFileSync(resolve(fixtureDirectory, name), "utf8");
const createRenderer = () => globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);

describe("shared Markdown renderer", () => {
  it("escapes raw HTML and blocks unsupported link schemes", () => {
    const html = createRenderer().render(readFixture("xss.md"));
    const output = document.createElement("div");
    output.innerHTML = html;

    expect(output.querySelector("script, iframe, img")).toBeNull();
    expect(output.textContent).toContain("<script>alert(“xss-1”)</script>");
    expect(html).not.toMatch(/href="(?:javascript|data|vbscript):/i);
  });

  it("marks external web links for safe new-window navigation", () => {
    const html = createRenderer().render(
      "[external](https://example.com) [mail](mailto:test@example.com) [relative](./notes.md)",
    );
    const output = document.createElement("div");
    output.innerHTML = html;

    const external = output.querySelector('a[href="https://example.com"]');
    const mail = output.querySelector('a[href="mailto:test@example.com"]');
    const relative = output.querySelector('a[href="./notes.md"]');

    expect(external?.getAttribute("target")).toBe("_blank");
    expect(external?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(mail?.hasAttribute("target")).toBe(false);
    expect(relative?.hasAttribute("target")).toBe(false);
  });

  it("adds copy controls to fenced and indented code without changing raw text", () => {
    const html = createRenderer().render(readFixture("code-blocks.md"));
    const output = document.createElement("div");
    output.innerHTML = html;

    const blocks = [...output.querySelectorAll(".codeblock")];
    expect(blocks).toHaveLength(7);
    expect(output.querySelectorAll(".copy-btn")).toHaveLength(blocks.length);
    expect(output.querySelector("code.language-js")?.textContent).toContain("function greet(name)");
    expect(blocks.at(-1)?.querySelector("code")?.textContent).toBe(
      '# This is an indented code block.\n# It should also get a Copy button.\necho "hello"\n',
    );
    expect(output.querySelector("code.language-html")?.textContent).toContain(
      '<script>alert("you should see this as text, not a popup")</script>',
    );

    const hostileInfo = document.createElement("div");
    hostileInfo.innerHTML = createRenderer().render('```"><img src=x onerror=alert(1)>\nsafe\n```');
    expect(hostileInfo.querySelector("img")).toBeNull();
    expect(hostileInfo.querySelector("code")?.textContent).toBe("safe\n");
  });

  it("optionally decorates mapped blocks without changing ordinary rendering", () => {
    const renderer = createRenderer();
    const markdown = "# Heading\n\nParagraph\n\n- one\n- two\n\n```js\ncode\n```";
    const ordinary = renderer.render(markdown);
    const mapped = renderer.render(markdown, { sourceMap: true });
    const output = document.createElement("div");
    output.innerHTML = mapped;

    expect(output.querySelector("h1")?.dataset.sourceLine).toBe("0");
    expect(output.querySelector("p")?.dataset.sourceLine).toBe("2");
    expect(output.querySelector("ul")?.dataset.sourceLine).toBe("4");
    expect(output.querySelector(".codeblock")?.dataset.sourceLine).toBe("7");
    expect(mapped.replace(/ data-source-(?:end-)?line="\d+"/g, "")).toBe(ordinary);
  });

  it("copies code text through the delegated copy handler", async () => {
    const output = document.createElement("div");
    output.innerHTML = createRenderer().render("```js\nconst answer = 42;\n```");
    document.body.appendChild(output);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const notify = vi.fn();
    const removeHandler = globalThis.QuickMarkMarkdown.installCodeCopyHandler(output, notify);

    output.querySelector(".copy-btn").click();

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("const answer = 42;");
      expect(notify).toHaveBeenCalledWith("Copied");
    });

    removeHandler();
    output.remove();
  });

  it("removes only terminal blank lines from copied code", async () => {
    const output = document.createElement("div");
    output.innerHTML = '<div class="codeblock"><button class="copy-btn"></button><pre><code></code></pre></div>';
    document.body.appendChild(output);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const removeHandler = globalThis.QuickMarkMarkdown.installCodeCopyHandler(output);
    const code = output.querySelector("code");
    const button = output.querySelector(".copy-btn");
    const cases = [
      ["dnf update\n", "dnf update"],
      ["dnf update\r\n", "dnf update"],
      ["  first\n\n\tsecond  \n \t\n", "  first\n\n\tsecond  "],
      ["  first\r\n\r\n\tsecond  \r\n \t\r\n", "  first\r\n\r\n\tsecond  "],
      [" \t\r\n\t\n", ""],
      ["", ""],
    ];

    for (const [input, expected] of cases) {
      code.textContent = input;
      button.click();
      await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expected));
    }

    removeHandler();
    output.remove();
  });

  it("renders every existing Markdown and text fixture without throwing", () => {
    const renderer = createRenderer();
    const fixtures = readdirSync(fixtureDirectory).filter((name) => /\.(?:md|markdown|txt)$/i.test(name));

    expect(fixtures.length).toBeGreaterThan(0);
    for (const fixture of fixtures) {
      expect(() => renderer.render(readFixture(fixture)), fixture).not.toThrow();
    }
  });

  it("preserves table and print-fixture semantics", () => {
    const renderer = createRenderer();
    const kitchenSink = renderer.render(readFixture("kitchen-sink.md"));
    const printFixture = renderer.render(readFixture("print-test.md"));

    expect(kitchenSink).toContain("<table>");
    expect(kitchenSink).toContain("<blockquote>");
    expect(printFixture).toContain("<h1>Print test</h1>");
    expect(printFixture).toContain('<div class="codeblock">');
  });

  it("renders every publicly supported Markdown dialect category", () => {
    const html = createRenderer().render(readFixture("markdown-dialect-supported.md"));
    const output = document.createElement("div");
    output.innerHTML = html;

    expect(output.querySelector("h1")?.textContent).toBe("ATX heading");
    expect(output.querySelector("h2")?.textContent).toBe("Setext heading");
    expect(output.querySelector("em")?.textContent).toBe("emphasis");
    expect(output.querySelector("strong")?.textContent).toBe("strong text");
    expect(output.querySelector("p code")?.textContent).toBe("inline code");
    expect(output.textContent).toContain("an & entity, and *escaped stars*");
    expect(output.querySelector("blockquote")?.textContent).toContain("A blockquote.");
    expect(output.querySelector("ul ul")?.textContent).toContain("Nested item");
    expect(output.querySelectorAll("ol > li")).toHaveLength(2);
    expect(output.querySelector('a[href="https://example.com"]')?.title).toBe("Example");
    expect(output.querySelector('a[href="./reference.md"]')?.textContent).toBe("reference link");
    expect(output.querySelector('img[src="./example.png"]')?.getAttribute("alt")).toBe("Image alt text");
    expect(output.querySelector("br")).not.toBeNull();
    const softBreakParagraph = [...output.querySelectorAll("p")].find((paragraph) =>
      paragraph.textContent.includes("A soft break stays in this paragraph"),
    );
    expect(softBreakParagraph?.querySelector("br")).toBeNull();
    expect(output.querySelector("hr")).not.toBeNull();
    expect(output.querySelectorAll("table th")).toHaveLength(3);
    expect(output.querySelector("table th:nth-child(2)")?.getAttribute("style")).toContain("text-align:center");
    expect(output.querySelector("s")?.textContent).toBe("Struck text");
    expect(output.querySelector('a[href="https://example.org"]')).not.toBeNull();
    expect(output.textContent).toContain("“Smart quotes”, ©, and three dots…");
    expect(output.querySelector("code.language-js")?.textContent).toContain("const answer = 42;");
    expect([...output.querySelectorAll(".codeblock code")].at(-1)?.textContent).toBe("indented code\n");
  });

  it("keeps restricted and unsupported dialect syntax inert", () => {
    const html = createRenderer().render(readFixture("markdown-dialect-unsupported.md"));
    const output = document.createElement("div");
    output.innerHTML = html;

    expect(output.querySelector("h1")?.id).toBe("");
    expect(output.querySelector("h1")?.textContent).toContain("{#custom-heading}");
    expect(output.querySelector('input[type="checkbox"], dl, math, svg:not(.copy-btn svg)')).toBeNull();
    expect(output.textContent).toContain("[x] Completed marker");
    expect(output.querySelector("strong")).toBeNull();
    expect(output.textContent).toContain("Raw <strong>HTML</strong> stays text.");
    expect(output.querySelector("sup")).toBeNull();
    expect(output.textContent).toContain("Footnote");
    expect(output.textContent).toContain(": Definition");
    expect(output.textContent).toContain("title: Front matter");
    expect(output.textContent).toContain("$x^2$");
    expect(output.querySelector("code.language-mermaid")?.textContent).toContain("graph TD; A-->B");
    expect(output.querySelector("code.language-js")?.textContent).toContain("const plain = true;");
    expect(output.querySelector(".hljs")).toBeNull();
  });
});

describe("shared presentation assets", () => {
  it("retain print rules for rendered content and copy controls", () => {
    const css = readFileSync(resolve(projectRoot, "shared/markdown.css"), "utf8");

    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.copy-btn\s*\{\s*display: none !important;/);
    expect(css).toMatch(/\.codeblock\s*\{[\s\S]*background: #f8f9fa;/);
    expect(css).toMatch(/\.viewer th,[\s\S]*border: 1px solid #999;/);
  });

  it("is consumed by the desktop entry point", () => {
    const desktopHtml = readFileSync(resolve(projectRoot, "index.html"), "utf8");
    const desktopMain = readFileSync(resolve(projectRoot, "src/main.ts"), "utf8");
    const desktopCss = readFileSync(resolve(projectRoot, "src/styles.css"), "utf8");

    expect(desktopHtml).toContain('href="/markdown.css"');
    expect(desktopHtml).toContain('src="/markdown-renderer.js"');
    expect(desktopHtml).toContain('src="/editor-behavior.js"');
    expect(desktopMain).toContain("QuickMarkEditor.installMarkdownEditorBehavior(editor)");
    expect(desktopHtml).toMatch(/<label[^>]+for="editor"/);
    expect(desktopHtml).toMatch(/<textarea[\s\S]*?id="editor"/);
    expect(desktopHtml).toContain('aria-describedby="editor-help"');
    expect(desktopHtml).toContain("Press Escape, then Tab to leave the editor.");
    expect(desktopCss).toMatch(/textarea:focus-visible\s*\{/);
  });
});
