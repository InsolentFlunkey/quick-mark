export interface RenderedImageData {
  readonly bytes: number[];
  readonly mime: string;
}

export interface RenderedResourceOutcome {
  readonly status: "success" | "failed";
  readonly message: string;
}

export interface RenderedResourceDependencies {
  getDocumentPath(): string | null;
  openExternal(url: string): Promise<void>;
  resolveDocumentLink(documentPath: string, reference: string): Promise<string>;
  openRelativeDocument(path: string): Promise<void>;
  readLocalImage(documentPath: string, reference: string): Promise<RenderedImageData>;
  report(outcome: RenderedResourceOutcome): void;
  createObjectUrl?(blob: Blob): string;
  revokeObjectUrl?(url: string): void;
}

function isExternalUrl(value: string) {
  return /^(?:https?:|mailto:)/i.test(value);
}

function isRemoteImage(value: string) {
  return /^https?:/i.test(value);
}

function hasScheme(value: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

function isAbsolutePath(value: string) {
  return /^(?:[\\/]|[a-z]:[\\/])/i.test(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function installRenderedResourceController(
  root: HTMLElement,
  dependencies: RenderedResourceDependencies,
) {
  const createObjectUrl = dependencies.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeObjectUrl = dependencies.revokeObjectUrl ?? ((url: string) => URL.revokeObjectURL(url));
  let objectUrls: string[] = [];
  let generation = 0;

  const reportFailure = (message: string) => dependencies.report({ status: "failed", message });

  const onClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    const href = target.getAttribute("href")?.trim() ?? "";

    if (href.startsWith("#")) {
      let id = href.slice(1);
      try { id = decodeURIComponent(id); } catch { /* report the missing encoded target below */ }
      const candidate = id ? root.ownerDocument.getElementById(id) : root;
      const destination = candidate && root.contains(candidate) ? candidate : id ? null : root;
      if (destination) destination.scrollIntoView();
      else reportFailure(`Could not find the in-document target ${href}.`);
      return;
    }

    if (isExternalUrl(href)) {
      void dependencies.openExternal(href).catch((error) =>
        reportFailure(`Could not open ${href}: ${errorMessage(error)}`),
      );
      return;
    }


    if (hasScheme(href) || isAbsolutePath(href)) {
      reportFailure(`QuickMark blocked the unsupported link target ${href}.`);
      return;
    }

    const documentPath = dependencies.getDocumentPath();
    if (!documentPath) {
      reportFailure("Save or open this document before using a relative document link.");
      return;
    }

    void dependencies.resolveDocumentLink(documentPath, href)
      .then((path) => dependencies.openRelativeDocument(path))
      .catch((error) => reportFailure(`Could not open ${href}: ${errorMessage(error)}`));
  };

  root.addEventListener("click", onClick);
  root.addEventListener("auxclick", onClick);

  return Object.freeze({
    refresh() {
      generation += 1;
      const refreshGeneration = generation;
      for (const url of objectUrls) revokeObjectUrl(url);
      objectUrls = [];

      for (const image of root.querySelectorAll<HTMLImageElement>("img[src]")) {
        const reference = image.getAttribute("src")?.trim() ?? "";
        if (!reference || isRemoteImage(reference)) continue;

        const originalTitle = image.getAttribute("title");
        image.removeAttribute("src");
        image.dataset.resourceReference = reference;
        image.classList.add("resource-image--pending");
        const documentPath = dependencies.getDocumentPath();
        if (!documentPath) {
          image.classList.replace("resource-image--pending", "resource-image--failed");
          image.title = "Local images require a saved or opened document.";
          continue;
        }

        void dependencies.readLocalImage(documentPath, reference).then((result) => {
          if (generation !== refreshGeneration || !image.isConnected) return;
          const objectUrl = createObjectUrl(new Blob([new Uint8Array(result.bytes)], { type: result.mime }));
          objectUrls.push(objectUrl);
          image.src = objectUrl;
          image.classList.remove("resource-image--pending", "resource-image--failed");
          if (originalTitle) image.title = originalTitle;
          else image.removeAttribute("title");
        }).catch((error) => {
          if (generation !== refreshGeneration || !image.isConnected) return;
          image.classList.replace("resource-image--pending", "resource-image--failed");
          image.title = errorMessage(error);
          reportFailure(`Could not load image ${reference}: ${errorMessage(error)}`);
        });
      }
    },
    dispose() {
      generation += 1;
      root.removeEventListener("click", onClick);
      root.removeEventListener("auxclick", onClick);
      for (const url of objectUrls) revokeObjectUrl(url);
      objectUrls = [];
    },
  });
}
