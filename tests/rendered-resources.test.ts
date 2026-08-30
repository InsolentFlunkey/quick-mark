import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installRenderedResourceController,
  type RenderedResourceDependencies,
} from "../src/rendered-resources";

function dependencies(overrides: Partial<RenderedResourceDependencies> = {}): RenderedResourceDependencies {
  return {
    getDocumentPath: () => "/notes/active.md",
    openExternal: vi.fn().mockResolvedValue(undefined),
    resolveDocumentLink: vi.fn().mockResolvedValue("/notes/target.md"),
    openRelativeDocument: vi.fn().mockResolvedValue(undefined),
    readLocalImage: vi.fn().mockResolvedValue({ bytes: [1, 2, 3], mime: "image/png" }),
    report: vi.fn(),
    createObjectUrl: vi.fn().mockReturnValue("blob:local-image"),
    revokeObjectUrl: vi.fn(),
    ...overrides,
  };
}

function preview(markup: string) {
  const root = document.createElement("div");
  root.innerHTML = markup;
  document.body.append(root);
  return root;
}

function click(target: Element) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe("rendered resource controller", () => {
  beforeEach(() => { document.body.replaceChildren(); });

  it("opens web and mail links externally without allowing WebView navigation", async () => {
    const root = preview('<a href="https://example.com">web</a><a href="mailto:test@example.com">mail</a>');
    const deps = dependencies();
    installRenderedResourceController(root, deps);

    expect(click(root.querySelectorAll("a")[0]).defaultPrevented).toBe(true);
    expect(click(root.querySelectorAll("a")[1]).defaultPrevented).toBe(true);
    await vi.waitFor(() => {
      expect(deps.openExternal).toHaveBeenCalledWith("https://example.com");
      expect(deps.openExternal).toHaveBeenCalledWith("mailto:test@example.com");
    });
  });

  it("also prevents auxiliary-click navigation", async () => {
    const root = preview('<a href="https://example.com">web</a>');
    const deps = dependencies();
    installRenderedResourceController(root, deps);
    const event = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
    root.querySelector("a")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(deps.openExternal).toHaveBeenCalledWith("https://example.com"));
  });

  it("resolves relative documents from the active path before opening them", async () => {
    const root = preview('<a href="../guide.md">guide</a>');
    const deps = dependencies();
    installRenderedResourceController(root, deps);

    expect(click(root.querySelector("a")!).defaultPrevented).toBe(true);
    await vi.waitFor(() => {
      expect(deps.resolveDocumentLink).toHaveBeenCalledWith("/notes/active.md", "../guide.md");
      expect(deps.openRelativeDocument).toHaveBeenCalledWith("/notes/target.md");
    });
  });

  it("reports pathless, missing, absolute, and dangerous link targets safely", async () => {
    const untitledRoot = preview('<a href="guide.md">guide</a>');
    const untitled = dependencies({ getDocumentPath: () => null });
    installRenderedResourceController(untitledRoot, untitled);
    click(untitledRoot.querySelector("a")!);
    expect(untitled.report).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Save or open") }));

    const missingRoot = preview('<a href="missing.md">missing</a>');
    const missing = dependencies({ resolveDocumentLink: vi.fn().mockRejectedValue(new Error("not found")) });
    installRenderedResourceController(missingRoot, missing);
    click(missingRoot.querySelector("a")!);
    await vi.waitFor(() => expect(missing.report).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("not found") }),
    ));

    for (const href of ["javascript:alert(1)", "data:text/plain,no", "/absolute.md", "C:\\absolute.md"]) {
      const blockedRoot = preview(`<a href="${href}">blocked</a>`);
      const blocked = dependencies();
      installRenderedResourceController(blockedRoot, blocked);
      expect(click(blockedRoot.querySelector("a")!).defaultPrevented).toBe(true);
      expect(blocked.resolveDocumentLink).not.toHaveBeenCalled();
      expect(blocked.report).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("blocked") }));
    }
  });

  it("loads relative images into object URLs and preserves remote images", async () => {
    const root = preview('<img src="local.png" alt="local"><img src="https://example.com/remote.png" alt="remote">');
    const deps = dependencies();
    const controller = installRenderedResourceController(root, deps);
    controller.refresh();

    const [local, remote] = [...root.querySelectorAll("img")];
    expect(local.hasAttribute("src")).toBe(false);
    expect(remote.src).toBe("https://example.com/remote.png");
    await vi.waitFor(() => expect(local.src).toBe("blob:local-image"));
    expect(deps.readLocalImage).toHaveBeenCalledWith("/notes/active.md", "local.png");

    controller.refresh();
    expect(deps.revokeObjectUrl).toHaveBeenCalledWith("blob:local-image");
  });

  it("keeps unavailable local images inert with understandable feedback", async () => {
    const untitledRoot = preview('<img src="local.png" alt="local">');
    const untitled = dependencies({ getDocumentPath: () => null });
    installRenderedResourceController(untitledRoot, untitled).refresh();
    expect(untitledRoot.querySelector("img")?.classList).toContain("resource-image--failed");
    expect(untitledRoot.querySelector("img")?.title).toContain("saved or opened");

    const missingRoot = preview('<img src="missing.png" alt="missing">');
    const missing = dependencies({ readLocalImage: vi.fn().mockRejectedValue(new Error("not found")) });
    installRenderedResourceController(missingRoot, missing).refresh();
    await vi.waitFor(() => expect(missingRoot.querySelector("img")?.classList).toContain("resource-image--failed"));
    expect(missing.report).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("not found") }));
  });
});
