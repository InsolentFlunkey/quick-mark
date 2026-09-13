import { readFileSync, readdirSync } from "node:fs";
import { posix } from "node:path";
import MarkdownIt from "markdown-it";
import { describe, expect, it, vi } from "vitest";
import { bundledGuides, resolveBundledGuide } from "../src/bundled-guides";
import { installRenderedResourceController } from "../src/rendered-resources";

describe("offline documentation", () => {
  it("ships the exact guide sources and resolves every relative link on GitHub and offline", () => {
    const renderer = new MarkdownIt();
    expect(Object.keys(bundledGuides).sort()).toEqual([
      "README.md", ...readdirSync("docs").filter(name => name.endsWith(".md")).map(name => `docs/${name}`),
    ].sort());
    for (const [path, content] of Object.entries(bundledGuides)) {
      expect(content).toBe(readFileSync(path, "utf8"));
      const root = document.createElement("div");
      root.innerHTML = renderer.render(content);
      expect(root.querySelectorAll("h1")).toHaveLength(1);
      if (path !== "README.md") expect(root.querySelector('a[href="../README.md"]')?.textContent).toBe("README");
      for (const link of root.querySelectorAll("a[href]")) {
        const href = link.getAttribute("href")!;
        if (/^https?:/.test(href)) continue;
        const target = resolveBundledGuide(path, href);
        expect(target).toBe(posix.normalize(posix.join(posix.dirname(path), href)));
        expect(bundledGuides[target]).toBeTruthy();
      }
    }
  });

  it.each(["../../README.md", "../src/markdown-examples.md", "/README.md", "file:README.md", "https://example.com", "%2e%2e/README.md", "..\\README.md", "editing.md#heading", "editing.md?raw", "constructor"])("rejects unbundled target %s", href => {
    expect(() => resolveBundledGuide("docs/editing.md", href)).toThrow();
  });

  it("navigates bundled content without filesystem access and reports unknown links without replacing the guide", () => {
    const root = document.createElement("div");
    document.body.append(root);
    let current = "README.md";
    const render = () => { root.innerHTML = new MarkdownIt().render(bundledGuides[current]); };
    const deps = {
      getDocumentPath: () => null,
      openExternal: vi.fn().mockResolvedValue(undefined),
      resolveDocumentLink: vi.fn(), openRelativeDocument: vi.fn(), readLocalImage: vi.fn(), report: vi.fn(),
      openBundledDocument: (href: string) => { current = resolveBundledGuide(current, href); render(); },
    };
    const controller = installRenderedResourceController(root, deps);
    render();
    root.querySelector<HTMLAnchorElement>('a[href="docs/editing.md"]')!.click();
    expect(current).toBe("docs/editing.md");
    root.querySelector<HTMLAnchorElement>('a[href="linting.md"]')!.click();
    expect(current).toBe("docs/linting.md");
    root.querySelector<HTMLAnchorElement>('a[href="../README.md"]')!.click();
    expect(current).toBe("README.md");
    const invalid = document.createElement("a");
    invalid.href = "docs/missing.md";
    root.append(invalid);
    invalid.click();
    expect(current).toBe("README.md");
    expect(deps.report).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
    expect(deps.resolveDocumentLink).not.toHaveBeenCalled();
    expect(deps.openRelativeDocument).not.toHaveBeenCalled();
    expect(deps.readLocalImage).not.toHaveBeenCalled();
    expect(deps.openExternal).not.toHaveBeenCalled();
    controller.dispose();
    root.remove();
  });
});
