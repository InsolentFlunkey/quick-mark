# Markdown support

[README](../README.md)

QuickMark uses the default syntax rules from markdown-it 15 with URL linkification and typographic replacements enabled. This is a CommonMark-derived dialect with selected extensions, not a claim of complete CommonMark or GitHub Flavored Markdown compatibility. The table describes this release; unsupported optional syntax is not permanently excluded from future development.

| Category | Status | QuickMark behavior |
| --- | --- | --- |
| Core block syntax | Supported | Paragraphs, ATX and Setext headings, blockquotes, ordered and unordered lists, thematic breaks, fenced code blocks, and indented code blocks render normally. |
| Core inline syntax | Supported | Emphasis, strong emphasis, inline code, escapes, entities, links, reference links, images, and hard line breaks render normally. A single newline remains a soft break because `breaks` is disabled. Desktop link and image destinations follow the resource rules below. |
| Tables | Supported extension | markdown-it's built-in GFM-style table rule is enabled, including column alignment markers. This does not imply support for every GFM feature. |
| Strikethrough | Supported extension | Text delimited by `~~` renders as strikethrough using markdown-it's built-in rule. |
| Bare URLs and typography | Supported extensions | URL-like text is automatically linked. Straight quotation marks and selected character sequences are replaced by markdown-it's language-neutral typographer rules. |
| Code language labels and copying | Supported presentation | A fenced code language adds a `language-*` class, and fenced or indented blocks receive a Copy button. QuickMark does not perform colored syntax highlighting. |
| Raw HTML | Deliberately restricted | HTML blocks and inline tags are displayed as text rather than inserted into the document. |
| Link schemes | Deliberately restricted | HTTP, HTTPS, mailto, in-page anchors, and relative document paths are accepted. Explicit schemes such as `javascript`, `data`, and `vbscript`, absolute filesystem paths, and unsupported relative file types are rejected. |
| Task lists | Unsupported optional syntax | `[ ]` and `[x]` remain literal text in an ordinary list; QuickMark does not render checkboxes. |
| Footnotes and definition lists | Unsupported optional syntax | No footnote or definition-list plugins are enabled. Similar-looking input may be interpreted by ordinary link-reference or paragraph rules. |
| Heading anchors | Supported extension | Headings receive unique section anchors using the contract below. Explicit `{#id}` attributes remain literal text. |
| Front matter | Unsupported optional syntax | QuickMark does not interpret YAML, TOML, or JSON front matter. Delimiter lines may still have their normal Markdown meaning. |
| Math and diagrams | Unsupported optional syntax | TeX-style math remains text. Mermaid and other diagram fences render as code and are never executed. |
| Other plugin syntax | Unsupported unless listed above | Abbreviations, emoji shortcodes, superscript, subscript, inserted/marked text, containers, and a table of contents are not added by QuickMark. |

### Rendered links and images

- Clicking an HTTP or HTTPS link opens it in the system's default browser. A `mailto:` link opens the system's registered mail application. QuickMark intercepts both kinds so the editor window is never replaced by the destination.
- A fragment-only link stays in the current preview and scrolls to its matching heading. A missing or malformed target displays an error without leaving the app.
- A relative link to an `.md`, `.markdown`, or `.txt` file is resolved from the active document's folder and opens in a new tab, or focuses its existing tab and editor window. Other tabs and their unsaved edits remain intact. Missing or inaccessible files produce an error without replacing the current document.
- Relative local images are also resolved from the active document's folder. PNG, JPEG, GIF, WebP, and BMP files up to 10 MiB are loaded through a restricted native reader. Missing, inaccessible, oversized, and unsupported local images remain inert and show their alternative text and an explanatory tooltip or status message.
- Explicit HTTP(S) image URLs remain remote images. QuickMark does not load `data:`, SVG, absolute-filesystem, or other explicitly schemed local image targets.
- An untitled document and the bundled reference windows have no filesystem folder. Save the document first before using relative document links or local images. This restriction does not affect web links or remote HTTP(S) images. Help → README separately supports navigation among its bundled guides without filesystem access; it cannot open arbitrary local documents.

### Section links

Use `[Getting started](#getting-started)` to navigate to `## Getting Started!`.
This works in unsaved documents and reference windows as well as saved files.
The target belongs to the preview containing the link, even when another tab or
window has the same heading. With **Sync Scrolling** on, Source follows the
preview's scroll position; section navigation does not change the source caret.

QuickMark generates anchors from heading text using these rules:

1. Use visible inline text, including code, link labels and image alternative
   text; omit formatting markers and link destinations.
2. Normalize Unicode to NFC and lowercase. Keep Unicode letters, marks, numbers,
   underscores and hyphens; remove other punctuation and symbols. Trim whitespace
   and replace each remaining whitespace run with a hyphen.
3. Use `section` if nothing remains. Allocate names in document order, adding
   `-1`, `-2`, etc. until the name is unique, including collisions with headings
   whose text already ends in a number. For example, `Name`, `Name`, `Name-1`,
   `Name` produce `name`, `name-1`, `name-1-1`, `name-2`.

`## Café 中文` becomes `café-中文`. Links can use that Unicode directly or its
URI-encoded equivalent. Fragments are decoded once and matched case-sensitively;
`#Café` does not match `café`. Renaming, removing or reordering duplicate headings
can change destinations; run **Lint** to find broken links.

`[Start](#)` scrolls to the preview's top. `#top` is an ordinary heading anchor:
it works only if a heading generates `top`. `{#custom}` does not assign a custom
ID; it remains part of the heading text used to generate the automatic anchor.
Raw HTML `id`/`name` attributes are displayed literally and create no targets.
GitHub fragments such as `#L20` or `#L19C5-L21C11` have no line-selection meaning;
they must match an actual generated heading to work. File-qualified destinations
such as `other.md#section` are not supported section links. External URL fragments
remain the responsibility of the system browser.
