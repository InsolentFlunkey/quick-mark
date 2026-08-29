(function initializeQuickMarkMarkdown(root) {
  const copyIconSvg =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>' +
    "</svg>";

  function codeBlockHtml(code, languageClass, escapeHtml, sourceAttributes) {
    return (
      `<div class="codeblock"${sourceAttributes}>` +
      '<button class="copy-btn" type="button" aria-label="Copy to clipboard" title="Copy">' +
      copyIconSvg +
      "</button>" +
      `<pre><code${languageClass}>${escapeHtml(code)}</code></pre>` +
      "</div>"
    );
  }

  function createMarkdownRenderer(markdownIt) {
    if (typeof markdownIt !== "function") {
      throw new TypeError("A markdown-it constructor is required");
    }

    const parser = markdownIt({
      html: false,
      linkify: true,
      typographer: true,
      breaks: false,
    });

    parser.validateLink = (url) => {
      const trimmed = (url || "").trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("#")) return true;
      if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) return true;
      const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
      if (!schemeMatch) return true;
      const scheme = schemeMatch[1].toLowerCase();
      return scheme === "http" || scheme === "https" || scheme === "mailto";
    };

    const defaultLinkOpen =
      parser.renderer.rules.link_open ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    parser.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const hrefIndex = token.attrIndex("href");
      const href = hrefIndex >= 0 ? token.attrs[hrefIndex][1] : "";
      if (/^https?:\/\//i.test(href)) {
        token.attrSet("target", "_blank");
        token.attrSet("rel", "noopener noreferrer");
      }
      return defaultLinkOpen(tokens, idx, options, env, self);
    };

    parser.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const info = (token.info || "").trim().split(/\s+/)[0] || "";
      const className = info ? ` class="language-${parser.utils.escapeHtml(info)}"` : "";
      return codeBlockHtml(token.content || "", className, parser.utils.escapeHtml, self.renderAttrs(token));
    };

    parser.renderer.rules.code_block = (tokens, idx, options, env, self) =>
      codeBlockHtml(tokens[idx].content || "", "", parser.utils.escapeHtml, self.renderAttrs(tokens[idx]));

    return Object.freeze({
      render(markdown, renderOptions = {}) {
        if (!renderOptions.sourceMap) return parser.render(markdown || "");
        const tokens = parser.parse(markdown || "", {});
        for (const token of tokens) {
          if (!token.map || token.nesting < 0) continue;
          token.attrSet("data-source-line", String(token.map[0]));
          token.attrSet("data-source-end-line", String(token.map[1]));
        }
        return parser.renderer.render(tokens, parser.options, {});
      },
    });
  }

  async function copyText(text, documentRoot) {
    try {
      await root.navigator.clipboard.writeText(text);
    } catch {
      const textarea = documentRoot.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      documentRoot.body.appendChild(textarea);
      textarea.select();
      documentRoot.execCommand("copy");
      textarea.remove();
    }
  }

  function installCodeCopyHandler(eventRoot, notify = () => {}) {
    const handleClick = async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest(".copy-btn");
      if (!button || !eventRoot.contains(button)) return;

      const code = button.closest(".codeblock")?.querySelector("pre code");
      if (!code) return;

      await copyText(code.textContent || "", button.ownerDocument);
      notify("Copied");
    };

    eventRoot.addEventListener("click", handleClick);
    return () => eventRoot.removeEventListener("click", handleClick);
  }

  root.QuickMarkMarkdown = Object.freeze({
    createMarkdownRenderer,
    installCodeCopyHandler,
  });
})(globalThis);
