export interface DocumentTab {
  id: string;
  name: string;
  path: string | null;
  dirty: boolean;
}
export function createDocumentTabs(root: HTMLElement, select: (id: string) => void, close: (id: string) => void) {
  let tabs: readonly DocumentTab[] = [];
  root.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-document]");
    if (!button) return;
    if (button.dataset.close) close(button.dataset.document!);
    else select(button.dataset.document!);
  });
  root.addEventListener("keydown", event => {
    const target = (event.target as Element).closest<HTMLButtonElement>('[role="tab"]');
    if (!target) return;
    const index = tabs.findIndex(tab => tab.id === target.dataset.document);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else if (event.key === "Delete") { event.preventDefault(); close(tabs[index].id); return; }
    else return;
    event.preventDefault(); select(tabs[next].id);
    root.querySelector<HTMLButtonElement>(`[role="tab"][data-document="${tabs[next].id}"]`)?.focus();
  });
  return {
    render(next: readonly DocumentTab[], active: string) {
      tabs = next;
      for (const child of [...root.children]) {
        if (!tabs.some(tab => tab.id === (child as HTMLElement).dataset.document)) child.remove();
      }
      for (const tab of tabs) {
        let row = [...root.children].find(node => (node as HTMLElement).dataset.document === tab.id) as HTMLElement | undefined;
        if (!row) {
          row = document.createElement("div"); row.className = "document-tab"; row.dataset.document = tab.id; row.setAttribute("role", "presentation");
          const button = document.createElement("button"); button.type = "button"; button.setAttribute("role", "tab");
          button.dataset.document = tab.id; button.id = `tab-${tab.id}`; button.setAttribute("aria-controls", "document-panel");
          const close = document.createElement("button"); close.type = "button"; close.dataset.document = tab.id; close.dataset.close = "true";
          row.append(button, close); root.append(row);
        }
        const [button, close] = [...row.children] as HTMLButtonElement[];
        const duplicates = tabs.filter(other => other.name === tab.name).length > 1;
        const label = duplicates ? (tab.path ?? `${tab.name} (${tabs.indexOf(tab) + 1})`) : tab.name;
        button.textContent = `${tab.dirty ? "• " : ""}${label}`;
        button.title = tab.path ?? label;
        button.setAttribute("aria-label", `${label}${tab.dirty ? ", unsaved changes" : ""}`);
        button.setAttribute("aria-selected", String(tab.id === active)); button.tabIndex = tab.id === active ? 0 : -1;
        close.setAttribute("aria-label", `Close ${label}`); close.title = `Close ${label}`;
        close.tabIndex = tab.id === active ? 0 : -1;
        row.dataset.active = String(tab.id === active);
      }
    },
  };
}
