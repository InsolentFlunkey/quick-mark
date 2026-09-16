import { completedFileEdit, completionContext, encodePathSegment } from "./path-completion-context";

export interface PathEntry { name: string; kind: "directory" | "document" | "image" }
export interface PathListing { entries: PathEntry[]; truncated: boolean }
interface Owner { id: string; path: string }
interface Snapshot { owner: Owner; source: string; caret: number }

export function installPathCompletion(editor: HTMLTextAreaElement, deps: {
  owner(): Owner | null;
  list(path: string, directory: string, prefix: string, image: boolean): Promise<PathListing>;
}) {
  const doc = editor.ownerDocument;
  const popup = doc.createElement("div");
  popup.className = "path-completion"; popup.hidden = true;
  const list = doc.createElement("div");
  list.id = `path-options-${crypto.randomUUID()}`;
  list.setAttribute("role", "listbox"); list.setAttribute("aria-label", "Path suggestions");
  const hint = doc.createElement("p");
  hint.className = "path-completion__hint";
  popup.append(list, hint); editor.parentElement!.append(popup);
  const status = doc.createElement("span");
  status.className = "sr-only"; status.setAttribute("role", "status");
  editor.parentElement!.append(status);
  editor.setAttribute("aria-autocomplete", "list");
  editor.setAttribute("aria-haspopup", "listbox");
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let snapshot: Snapshot | null = null;
  let entries: PathEntry[] = [];
  let selected = 0;
  let composing = false;
  let manual: (Owner & { start: number }) | null = null;

  function current(value: Snapshot) {
    const owner = deps.owner();
    return owner?.id === value.owner.id && owner.path === value.owner.path &&
      doc.activeElement === editor && !editor.hidden && !editor.readOnly && !editor.disabled &&
      editor.value === value.source && editor.selectionStart === value.caret && editor.selectionEnd === value.caret;
  }
  function close() {
    manual = null;
    generation++; clearTimeout(timer); timer = undefined;
    snapshot = null; entries = []; popup.hidden = true; list.replaceChildren(); status.textContent = "";
    editor.removeAttribute("aria-controls"); editor.removeAttribute("aria-activedescendant");
  }
  function validate() { if (snapshot && !current(snapshot)) close(); }
  function highlight() {
    [...list.children].forEach((node, index) => node.setAttribute("aria-selected", String(index === selected)));
    const option = list.children[selected] as HTMLElement;
    editor.setAttribute("aria-activedescendant", option.id);
    option.scrollIntoView?.({ block: "nearest" });
  }
  function refresh(explicit = false) {
    const previousManual = manual;
    close();
    const owner = deps.owner();
    const context = completionContext(editor.value, editor.selectionStart, editor.selectionEnd);
    if (!owner || !context || composing) return;
    const requested = explicit || (previousManual?.id === owner.id && previousManual.path === owner.path && previousManual.start === context.start);
    if (!requested && !/^\.\.?\//.test(context.directory)) return;
    const value = { owner, source: editor.value, caret: editor.selectionStart };
    if (!current(value)) return;
    if (requested) manual = { ...owner, start: context.start };
    snapshot = value;
    const request = generation;
    timer = setTimeout(async () => {
      try {
        const result = await deps.list(owner.path, context.directory || ".", context.prefix, context.image);
        if (generation !== request || !current(value)) return;
        entries = result.entries;
        if (!entries.length) {
          if (!requested) { close(); return; }
          const empty = doc.createElement("p");
          empty.className = "path-completion__empty";
          empty.textContent = context.image
            ? "No matching image or folder names found."
            : "No matching document or folder names found.";
          list.replaceChildren(empty);
          hint.textContent = "Keep typing or delete characters to change the search · Esc dismiss";
          popup.hidden = false;
          editor.setAttribute("aria-controls", list.id);
          editor.removeAttribute("aria-activedescendant");
          status.textContent = empty.textContent;
          return;
        }
        selected = 0;
        list.replaceChildren(...entries.map((entry, index) => {
          const option = doc.createElement("div");
          option.id = `${list.id}-${index}`; option.dataset.index = String(index);
          option.setAttribute("role", "option");
          const name = doc.createElement("span"); name.textContent = entry.name + (entry.kind === "directory" ? "/" : "");
          const kind = doc.createElement("small"); kind.textContent = entry.kind;
          option.append(name, kind); return option;
        }));
        hint.textContent = result.truncated ? "Some entries are not shown. Narrow the path."
          : "↑ ↓ choose · Tab / Enter insert · Esc dismiss";
        popup.hidden = false;
        editor.setAttribute("aria-controls", list.id);
        status.textContent = `${entries.length} path suggestions. Use Up and Down to choose, Tab or Enter to insert.`;
        highlight();
      } catch {
        if (generation === request) close();
      }
    }, 100);
  }
  function accept(index: number) {
    if (!snapshot || !current(snapshot)) { close(); return; }
    const context = completionContext(snapshot.source, snapshot.caret);
    const entry = entries[index];
    if (!context || !entry) { close(); return; }
    const edit = entry.kind === "directory"
      ? { text: context.directory + encodePathSegment(entry.name) + "/", end: context.end }
      : completedFileEdit(snapshot.source, context, entry.name);
    close();
    editor.setRangeText(edit.text, context.start, edit.end, "end");
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    // Files finish completion; directories request the next level through input.
    if (entry.kind !== "directory") close();
    else refresh(true);
  }
  function keydown(event: KeyboardEvent) {
    if (event.isComposing || composing) return;
    validate();
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && (event.code === "Space" || event.key === " ")) {
      if (completionContext(editor.value, editor.selectionStart, editor.selectionEnd)) {
        event.preventDefault(); refresh(true);
      }
      return;
    }
    if (event.key === "Escape") { close(); return; }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { close(); return; }
    if ((popup.hidden && !manual) || event.defaultPrevented) return;
    if (!popup.hidden && entries.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      selected = (selected + (event.key === "ArrowDown" ? 1 : entries.length - 1)) % entries.length;
      highlight();
    } else if (!popup.hidden && entries.length && (event.key === "Tab" || event.key === "Enter")) {
      event.preventDefault(); accept(selected);
    } else {
      const previousManual = manual;
      close();
      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete") manual = previousManual;
    }
  }
  function keyup(event: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) refresh();
  }
  function selectionChanged() { validate(); }
  function compositionStart() { composing = true; close(); }
  function compositionEnd() { composing = false; refresh(); }
  list.addEventListener("pointerdown", event => event.preventDefault());
  list.addEventListener("click", event => {
    const option = (event.target as Element).closest<HTMLElement>("[data-index]");
    if (option) accept(Number(option.dataset.index));
  });
  const automaticRefresh = () => refresh();
  editor.addEventListener("input", automaticRefresh);
  editor.addEventListener("click", automaticRefresh);
  editor.addEventListener("keydown", keydown, true);
  editor.addEventListener("keyup", keyup);
  editor.addEventListener("blur", close);
  editor.addEventListener("scroll", close);
  editor.addEventListener("compositionstart", compositionStart);
  editor.addEventListener("compositionend", compositionEnd);
  doc.addEventListener("selectionchange", selectionChanged);
  window.addEventListener("blur", close);
  window.addEventListener("resize", close);
  return {
    close, validate,
    destroy() {
      close(); popup.remove(); status.remove();
      editor.removeAttribute("aria-autocomplete"); editor.removeAttribute("aria-haspopup");
      editor.removeEventListener("input", automaticRefresh); editor.removeEventListener("click", automaticRefresh);
      editor.removeEventListener("keydown", keydown, true); editor.removeEventListener("keyup", keyup);
      editor.removeEventListener("blur", close); editor.removeEventListener("scroll", close);
      editor.removeEventListener("compositionstart", compositionStart); editor.removeEventListener("compositionend", compositionEnd);
      doc.removeEventListener("selectionchange", selectionChanged);
      window.removeEventListener("blur", close); window.removeEventListener("resize", close);
    },
  };
}
