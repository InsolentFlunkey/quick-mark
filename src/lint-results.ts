import { ruleConfigurationKey, type RuleOverrides } from "./lint-rules";
import type { SaveSnapshot } from "./document-operations";
import { LintClient } from "./lint-client";
import { cloneLintState, nearestIssue, PROFILE_VERSION, sourceRange, type LintState } from "./lint-state";
import type { DocumentWorkspace } from "./document-workspace";
import { measureSourceLines } from "./scroll-sync";

export const REALTIME_LINT_DEBOUNCE_MS = 750;

export function createLintResults(deps: {
  workspace: DocumentWorkspace;
  editor(): HTMLTextAreaElement | null;
  preview: HTMLElement;
  container: HTMLElement;
  canRun(): boolean;
  getRules?(): RuleOverrides;
  loadRules?(): Promise<RuleOverrides>;
  indicator?: HTMLButtonElement | null;
  capture(): void;
  applyView(): void;
}, client = new LintClient()) {
  const panel = document.createElement("section");
  panel.className = "lint-panel"; panel.hidden = true;
  panel.setAttribute("aria-label", "Markdown lint inspection");
  const controls = document.createElement("div"); controls.className = "lint-controls";
  const summary = document.createElement("p"); summary.setAttribute("role", "status"); summary.setAttribute("aria-live", "polite");
  const list = document.createElement("ol"); list.className = "lint-issues"; list.tabIndex = 0;
  list.setAttribute("aria-label", "Lint issues");
  panel.append(controls, summary, list); deps.container.append(panel);
  let request = 0;
  let saving = false;
  let loadingRules = false;
  let runningId: string | null = null;
  let runningKind: "manual" | "realtime" | null = null;
  let realtimeEnabled = false;
  let realtimeTimer: ReturnType<typeof setTimeout> | null = null;
  let displayed = "";
  let rendering = false;
  let suppress = false;
  let frame = 0;
  let bound: HTMLTextAreaElement | null = null;
  let geometryKey = "";
  let geometry = new Map<number, number>();
  function positionsFor(value: LintState, editor: HTMLTextAreaElement) {
    const key = `${deps.workspace.activeId}:${request}:${editor.clientWidth}:${getComputedStyle(editor).font}`;
    if (key !== geometryKey) {
      geometryKey = key;
      geometry = measureSourceLines(editor, editor.value, value.issues.map(issue => issue.line - 1));
    }
    return geometry;
  }
  const state = () => deps.workspace.view(deps.workspace.activeId!).lint;
  const put = (id: string, lint: LintState) => deps.workspace.setView(id, { ...deps.workspace.view(id), lint });
  const button = (label: string, action: () => void) => {
    const node = document.createElement("button"); node.type = "button"; node.textContent = label;
    node.addEventListener("click", action); controls.append(node); return node;
  };
  function changePane(pane: "results" | "preview") {
    if (!deps.canRun()) return;
    const value = state(); if (!value) return;
    value.pane = pane; put(deps.workspace.activeId!, value); refresh();
  }
  const resultsButton = button("Lint Results", () => changePane("results"));
  const previewButton = button("Preview", () => changePane("preview"));
  const runButton = button("Run Again", () => void run());
  const cancelButton = button("Cancel Lint", () => cancel());
  button("Return to Previous View", () => exit());
  const previous = button("Previous Issue", () => navigate(-1));
  const next = button("Next Issue", () => navigate(1));
  const more = button("Load more", () => {
    if (!deps.canRun()) return;
    const value = state(); if (!value) return;
    value.visible += 200; put(deps.workspace.activeId!, value); refresh();
    if (more.hidden) list.focus();
  });
  more.className = "lint-load-more";
  const returnResults = (event: KeyboardEvent) => {
    if (event.key === "Escape" && event.altKey && state()?.inspecting) {
      event.preventDefault(); resultsButton.focus();
    }
  };

  function clearRealtimeTimer() {
    if (realtimeTimer !== null) clearTimeout(realtimeTimer);
    realtimeTimer = null;
  }

  function refreshIndicator() {
    if (!deps.indicator) return;
    const value = state();
    const current = value && value.source === deps.workspace.snapshot(deps.workspace.activeId!).content &&
      (value.configuration ?? ruleConfigurationKey()) === ruleConfigurationKey(deps.getRules?.() ?? {});
    const suffix = realtimeEnabled && current && value?.status === "complete" ? ` (${value.issues.length})` :
      realtimeEnabled && current && value?.status === "failed" ? " (!)" : "";
    deps.indicator.dataset.lintStatus = suffix === " (!)" ? "failed" :
      suffix && value!.issues.length > 0 ? "issues" : suffix ? "complete" : "idle";
    deps.indicator.textContent = `Lint${suffix}`;
    deps.indicator.setAttribute("aria-label", suffix === " (!)" ? "Lint Markdown, real-time check failed" :
      suffix ? `Lint Markdown, ${value!.issues.length} current ${value!.issues.length === 1 ? "issue" : "issues"}` : "Lint Markdown");
  }

  function supersedeRealtimeRun() {
    if (runningKind !== "realtime") return;
    if (runningId && deps.workspace.ids.includes(runningId)) {
      const value = deps.workspace.view(runningId).lint;
      if (value?.status === "running") put(runningId, { ...value, status: "canceled", error: "Real-time linting was superseded." });
    }
    request++;
    client.cancel("Real-time lint superseded by newer content.");
    runningId = null;
    runningKind = null;
  }

  function cancel() {
    clearRealtimeTimer();
    if (saving) { client.cancel(); return; }
    request++; client.cancel();
    if (runningId && deps.workspace.ids.includes(runningId)) {
      const value = deps.workspace.view(runningId).lint;
      if (value?.status === "running") { value.status = "canceled"; value.error = "Linting canceled. Run Again to retry."; put(runningId, value); }
    }
    runningId = null; runningKind = null; refresh();
  }
  async function run() {
    if (saving || !deps.canRun()) return;
    cancel(); deps.capture();
    const id = deps.workspace.activeId!;
    const source = deps.workspace.snapshot(id).content;
    const token = ++request;
    runningId = id; runningKind = "manual";
    loadingRules = true;
    put(id, { profile: PROFILE_VERSION, configuration: ruleConfigurationKey(deps.getRules?.() ?? {}), source, status: "running", issues: [], error: "", inspecting: true,
      pane: "results", selected: 0, visible: 200, resultsScroll: 0 });
    refresh(); runButton.focus();
    try {
      const rules = deps.loadRules ? await deps.loadRules() : deps.getRules?.() ?? {};
      if (token !== request || !deps.workspace.ids.includes(id)) return;
      if (!deps.canRun()) {
        const pending = deps.workspace.view(id).lint;
        if (pending) put(id, { ...pending, status: "canceled", error: "Linting canceled because a document operation started. Run Again to retry." });
        return;
      }
      const initial = deps.workspace.view(id).lint;
      if (!initial || initial.status !== "running") return;
      loadingRules = false;
      put(id, { ...initial, configuration: ruleConfigurationKey(rules) });
      const issues = await client.run(source, rules);
      if (token !== request || !deps.workspace.ids.includes(id)) return;
      const current = deps.workspace.view(id).lint;
      if (!current || current.status !== "running") return;
      put(id, cloneLintState({ ...current, issues,
        status: deps.workspace.snapshot(id).content === source && current.configuration === ruleConfigurationKey(deps.getRules?.() ?? {}) ? "complete" : "stale" }));
    } catch (error) {
      if (token !== request || !deps.workspace.ids.includes(id)) return;
      const current = deps.workspace.view(id).lint;
      if (current?.status === "running") put(id, { ...current, status: "failed", error: String(error) });
    } finally {
      if (token === request) { loadingRules = false; runningId = null; runningKind = null; refresh(); }
    }
  }

  async function runRealtime(id: string) {
    realtimeTimer = null;
    if (!realtimeEnabled || !deps.workspace.ids.includes(id)) return;
    if (saving || runningKind === "manual" || !deps.canRun()) {
      realtimeTimer = setTimeout(() => void runRealtime(id), REALTIME_LINT_DEBOUNCE_MS);
      return;
    }
    const source = deps.workspace.snapshot(id).content;
    const revision = deps.workspace.revision(id);
    const token = ++request;
    const previous = deps.workspace.view(id).lint;
    runningId = id; runningKind = "realtime"; loadingRules = true;
    put(id, { profile: PROFILE_VERSION, configuration: ruleConfigurationKey(deps.getRules?.() ?? {}), source,
      status: "running", issues: [], error: "", inspecting: previous?.inspecting ?? false,
      pane: previous?.pane ?? "results", selected: 0, visible: 200, resultsScroll: previous?.resultsScroll ?? 0 });
    refresh();
    try {
      const rules = deps.loadRules ? await deps.loadRules() : deps.getRules?.() ?? {};
      if (token !== request || !realtimeEnabled || !deps.workspace.ids.includes(id)) return;
      const configuration = ruleConfigurationKey(rules);
      const pending = deps.workspace.view(id).lint;
      if (!pending || pending.status !== "running" || pending.source !== source) return;
      loadingRules = false;
      put(id, { ...pending, configuration });
      const issues = await client.run(source, rules);
      if (token !== request || !realtimeEnabled || !deps.workspace.ids.includes(id)) return;
      const current = deps.workspace.view(id).lint;
      if (!current || current.status !== "running" || current.source !== source) return;
      if (deps.workspace.revision(id) !== revision || deps.workspace.snapshot(id).content !== source ||
        configuration !== ruleConfigurationKey(deps.getRules?.() ?? {})) {
        put(id, { ...current, status: "stale" });
        return;
      }
      put(id, cloneLintState({ ...current, issues, status: "complete" }));
    } catch (error) {
      if (token !== request || !deps.workspace.ids.includes(id)) return;
      const current = deps.workspace.view(id).lint;
      if (current?.status === "running" && current.source === source) {
        put(id, { ...current, status: "failed", error: String(error) });
      }
    } finally {
      if (token === request) { loadingRules = false; runningId = null; runningKind = null; refresh(); }
    }
  }

  function scheduleRealtime() {
    clearRealtimeTimer();
    supersedeRealtimeRun();
    refreshIndicator();
    if (!realtimeEnabled || saving || !deps.canRun() || !deps.workspace.activeId) return;
    const id = deps.workspace.activeId;
    if (deps.workspace.snapshot(id).content.length === 0) return;
    realtimeTimer = setTimeout(() => void runRealtime(id), REALTIME_LINT_DEBOUNCE_MS);
  }

  function scheduleRealtimeIfNeeded() {
    if (!realtimeEnabled || saving || !deps.canRun() || !deps.workspace.activeId) return;
    const id = deps.workspace.activeId;
    const source = deps.workspace.snapshot(id).content;
    if (source.length === 0) return;
    const value = deps.workspace.view(id).lint;
    const current = value?.source === source &&
      (value.configuration ?? ruleConfigurationKey()) === ruleConfigurationKey(deps.getRules?.() ?? {});
    if (current && (value.status === "complete" || value.status === "running")) {
      refreshIndicator();
      return;
    }
    scheduleRealtime();
  }

  function setRealtimeEnabled(enabled: boolean) {
    realtimeEnabled = enabled;
    if (!enabled) { clearRealtimeTimer(); supersedeRealtimeRun(); }
    else scheduleRealtime();
    refresh();
  }
  function exit() {
    if (!deps.canRun()) return;
    const value = state(); if (!value?.inspecting) return;
    value.inspecting = false; put(deps.workspace.activeId!, value);
    refresh(); deps.applyView();
    const editor = deps.editor(), view = deps.workspace.view(deps.workspace.activeId!);
    if (editor) { editor.scrollTop = view.editorScrollTop; editor.scrollLeft = view.editorScrollLeft; }
    deps.preview.scrollTop = view.previewScrollTop; deps.preview.scrollLeft = view.previewScrollLeft;
    editor?.focus();
  }
  function programmatic(action: () => void) {
    suppress = true; action();
    requestAnimationFrame(() => { suppress = false; });
  }
  function select(index: number, focus: boolean) {
    if (!deps.canRun()) return;
    const value = state(), editor = deps.editor();
    if (!value || value.status !== "complete" || !editor || !value.issues[index]) return;
    value.selected = index; value.visible = Math.max(value.visible, Math.ceil((index + 1) / 200) * 200);
    put(deps.workspace.activeId!, value); refresh();
    programmatic(() => {
      list.querySelector<HTMLElement>(`[data-issue="${index}"]`)?.scrollIntoView?.({ block: "nearest" });
      if (focus) {
        const range = sourceRange(editor.value, value.issues[index]);
        editor.focus(); editor.setSelectionRange(range.start, range.end);
        const positions = positionsFor(value, editor);
        editor.scrollTop = positions.get(value.issues[index].line - 1) ?? editor.scrollTop;
      }
    });
  }
  function navigate(delta: number) {
    const value = state(); if (!value?.issues.length) return;
    select(Math.max(0, Math.min(value.issues.length - 1, value.selected + delta)), true);
  }
  function sourceScrolled() { synchronize("source"); }
  function synchronize(owner: "source" | "results") {
    if (!deps.canRun() || suppress || rendering || frame) return;
    const value = state();
    if (!value?.inspecting || value.pane !== "results" || value.status !== "complete" ||
      !value.issues.length || !deps.workspace.view(deps.workspace.activeId!).preferences.syncScrolling) return;
    const origin = deps.workspace.activeId;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (origin !== deps.workspace.activeId) return;
      const current = state(), editor = deps.editor();
      if (!current?.inspecting || current.pane !== "results" || current.status !== "complete" || !editor || !deps.canRun()) return;
      const lines = [...new Set(current.issues.map(issue => issue.line - 1))];
      const positions = positionsFor(current, editor);
      if (owner === "source") {
        let closestLine = lines[0], distance = Infinity;
        for (const [line, position] of positions) {
          if (Math.abs(position - editor.scrollTop) < distance) { closestLine = line; distance = Math.abs(position - editor.scrollTop); }
        }
        select(nearestIssue(current.issues, closestLine + 1), false);
      } else {
        const top = list.getBoundingClientRect().top;
        const row = [...list.querySelectorAll<HTMLElement>("[data-issue]")].find(row => row.getBoundingClientRect().bottom > top);
        if (row) programmatic(() => { editor.scrollTop = positions.get(current.issues[Number(row.dataset.issue)].line - 1) ?? editor.scrollTop; });
      }
    });
  }
  list.addEventListener("scroll", () => {
    if (!deps.canRun()) return;
    const value = state();
    if (value && !rendering) { value.resultsScroll = list.scrollTop; put(deps.workspace.activeId!, value); }
    synchronize("results");
  });

  function refresh() {
    if (!deps.workspace.activeId) return;
    const configuration = ruleConfigurationKey(deps.getRules?.() ?? {});
    for (const documentId of deps.workspace.ids) {
      const cached = deps.workspace.view(documentId).lint;
      if (cached && !(loadingRules && documentId === runningId) &&
          (cached.configuration ?? ruleConfigurationKey()) !== configuration && (cached.status === "complete" || cached.status === "running")) {
        put(documentId, { ...cached, status: "stale" });
      }
    }
    const id = deps.workspace.activeId, value = state();
    if (!saving && runningId && (!deps.workspace.ids.includes(runningId) || deps.workspace.view(runningId).lint?.status !== "running")) {
      request++; client.cancel(); runningId = null; runningKind = null;
    }
    const editor = deps.editor();
    if (bound !== editor) {
      bound?.removeEventListener("scroll", sourceScrolled); bound?.removeEventListener("keydown", returnResults);
      bound = editor; bound?.addEventListener("scroll", sourceScrolled); bound?.addEventListener("keydown", returnResults);
    }
    panel.hidden = !value?.inspecting;
    deps.container.dataset.lint = value?.inspecting ? value.pane : "off";
    refreshIndicator();
    if (!value?.inspecting) { deps.preview.hidden = false; deps.applyView(); return; }
    deps.applyView();
    deps.container.dataset.view = "both"; deps.container.dataset.swapped = "false";
    deps.preview.hidden = value.pane === "results";
    list.hidden = value.pane !== "results"; summary.hidden = value.pane !== "results";
    resultsButton.setAttribute("aria-pressed", String(value.pane === "results"));
    previewButton.setAttribute("aria-pressed", String(value.pane === "preview"));
    for (const control of controls.querySelectorAll<HTMLButtonElement>("button")) control.disabled = !deps.canRun();
    runButton.disabled = saving || !deps.canRun();
    cancelButton.disabled = false; cancelButton.hidden = value.status !== "running";
    previous.disabled = next.disabled = !deps.canRun() || value.status !== "complete" || !value.issues.length;
    more.hidden = value.visible >= value.issues.length;
    const shown = Math.min(value.visible, value.issues.length);
    const count = `${shown ? 1 : 0}–${shown} of ${value.issues.length} issues found.`;
    const outcome = value.status === "running" ? "Linting…" : value.status === "stale" ? `Results out of date — Run Again. ${count}` :
      value.status === "complete" ? (value.issues.length ? count : "No issues found with the QuickMark profile.") : value.error;
    const text = `${deps.workspace.snapshot(id).displayName}: ${outcome} Profile: ${PROFILE_VERSION}`;
    if (summary.textContent !== text) summary.textContent = text;
    const signature = `${id}:${value.status}:${value.selected}:${value.visible}:${value.issues.length}:${request}`;
    if (signature !== displayed) {
      displayed = signature; rendering = true;
      const oldScroll = value.resultsScroll;
      list.replaceChildren();
      value.issues.slice(0,value.visible).forEach((issue,index) => {
        const row = document.createElement("li"); row.dataset.issue = String(index);
        const control = document.createElement("button"); control.type = "button";
        control.disabled = value.status !== "complete";
        control.setAttribute("aria-current", String(index === value.selected));
        const category = issue.rule === "MD033" ? "Compatibility" : ["MD045", "MD059"].includes(issue.rule) ? "Accessibility" :
          ["MD005", "MD011", "MD018", "MD020", "MD037", "MD042", "MD052", "MD056"].includes(issue.rule) ? "Syntax/structure" : "Formatting";
        control.textContent = `Line ${issue.line}${issue.column === null ? "" : `, column ${issue.column}`} · ${category} · ${issue.rule}: ${issue.message}`;
        control.addEventListener("click", () => select(index, true));
        const detail = document.createElement("p"); detail.textContent = issue.detail;
        const context = document.createElement("code"); context.textContent = issue.context || value.source.split("\n")[issue.line - 1]?.slice(0,240) || "";
        row.append(control, detail, context); list.append(row);
      });
      list.scrollTop = oldScroll; rendering = false;
    }
  }
  async function runForSave(snapshot: SaveSnapshot, rules: RuleOverrides = deps.getRules?.() ?? {}): Promise<LintState> {
    if (saving) throw new Error("Save lint already running");
    cancel(); saving = true;
    const id = snapshot.documentId;
    const previous = deps.workspace.view(id).lint;
    let value: LintState = { profile: PROFILE_VERSION, configuration: ruleConfigurationKey(rules), source: snapshot.content, status: "running", issues: [], error: "",
      inspecting: previous?.inspecting ?? false, pane: previous?.pane ?? "results", selected: 0, visible: 200, resultsScroll: 0 };
    put(id, value); refresh();
    try {
      const issues = await client.run(snapshot.content, rules);
      value = { ...value, issues, status: deps.workspace.revision(id) === snapshot.revision &&
        deps.workspace.snapshot(id).content === snapshot.content ? "complete" : "stale" };
    } catch (error) {
      const message = String(error);
      value = { ...value, status: /cancel/i.test(message) ? "canceled" : "failed", error: message };
    } finally { saving = false; }
    put(id, value); refresh();
    return value;
  }
  function showSnapshot(id: string) {
    const value = deps.workspace.view(id).lint;
    if (!value) return;
    put(id, { ...value, inspecting: true, pane: "results" });
    refresh(); summary.tabIndex = -1; summary.focus();
  }
  function showOrRun() {
    const id = deps.workspace.activeId!;
    const value = state();
    if (value?.status === "complete" && value.source === deps.workspace.snapshot(id).content &&
      (value.configuration ?? ruleConfigurationKey()) === ruleConfigurationKey(deps.getRules?.() ?? {})) {
      deps.capture(); showSnapshot(id); return Promise.resolve();
    }
    return run();
  }
  return { run, showOrRun, runForSave, showSnapshot, scheduleRealtime, scheduleRealtimeIfNeeded, setRealtimeEnabled,
    refresh, exit, cancel, inspecting: () => !!state()?.inspecting };
}
