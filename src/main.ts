import MarkdownIt from "markdown-it";

const sample = `# QuickMark Desktop

The desktop shell and legacy browser page now share one **Markdown renderer**.

\`\`\`ts
const message = "Copy controls work here too";
\`\`\`
`;

const preview = document.querySelector<HTMLElement>("#preview");
const copyStatus = document.querySelector<HTMLElement>("#copy-status");
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);

if (preview) {
  preview.innerHTML = renderer.render(sample);
  globalThis.QuickMarkMarkdown.installCodeCopyHandler(preview, (message) => {
    if (copyStatus) copyStatus.textContent = message;
  });
}

const platform = navigator.userAgentData?.platform ?? navigator.platform;
document.documentElement.dataset.platform = platform.toLowerCase();
