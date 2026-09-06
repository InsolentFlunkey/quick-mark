/** Pair the guide's source blocks with results from the application's renderer. */
export function renderCheatSheet(
  source: string,
  renderer: { render(source: string): string },
): string {
  const container = document.createElement("div");
  container.innerHTML = renderer.render(source);
  // Snapshot only the guide's original blocks; result code blocks are not examples to expand.
  const examples = [...container.querySelectorAll<HTMLElement>(".codeblock")];
  for (const [index, block] of examples.entries()) {
    const markdown = block.querySelector("pre code")?.textContent ?? "";
    const pair = document.createElement("section");
    pair.className = "cheat-sheet-example";
    pair.setAttribute("aria-label", `Example ${index + 1}`);
    const sourceLabel = document.createElement("p");
    sourceLabel.className = "cheat-sheet-example__label";
    sourceLabel.textContent = "Markdown source";
    const resultLabel = document.createElement("p");
    resultLabel.className = "cheat-sheet-example__label";
    resultLabel.id = `cheat-sheet-result-${index + 1}`;
    resultLabel.textContent = "Rendered result";
    const result = document.createElement("div");
    result.className = "cheat-sheet-example__result";
    result.setAttribute("role", "region");
    result.setAttribute("aria-labelledby", resultLabel.id);
    result.innerHTML = renderer.render(markdown);
    block.replaceWith(pair);
    pair.append(sourceLabel, block, resultLabel, result);
  }
  return container.innerHTML;
}
