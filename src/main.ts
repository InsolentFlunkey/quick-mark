import MarkdownIt from "markdown-it";

const sample = `# QuickMark Desktop

The desktop and legacy browser apps share the same **Markdown editor behavior**.

- Press Enter after a list item to continue it.
- Press Enter on a blank item to finish the list.

Use Tab and Shift+Tab to indent or outdent text.
`;

const editor = document.querySelector<HTMLTextAreaElement>("#editor");
const preview = document.querySelector<HTMLElement>("#preview");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const copyStatus = document.querySelector<HTMLElement>("#copy-status");
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);

function updatePreview() {
  if (!editor || !preview) return;
  preview.innerHTML = renderer.render(editor.value);
  if (editorStatus) {
    const count = editor.value.length;
    editorStatus.textContent = `${count.toLocaleString()} ${count === 1 ? "character" : "characters"}`;
  }
}

if (editor && preview) {
  editor.value = sample;
  editor.addEventListener("input", updatePreview);
  globalThis.QuickMarkEditor.installMarkdownEditorBehavior(editor);
  globalThis.QuickMarkMarkdown.installCodeCopyHandler(preview, (message) => {
    if (copyStatus) copyStatus.textContent = message;
  });
  updatePreview();
}

const platform = navigator.userAgentData?.platform ?? navigator.platform;
document.documentElement.dataset.platform = platform.toLowerCase();
