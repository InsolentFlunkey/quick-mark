import MarkdownIt from "markdown-it";
import bundledReadme from "../README.md?raw";
import bundledExamples from "./markdown-examples.md?raw";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { DocumentLifecycle } from "./document-lifecycle";
import { saveDocument } from "./document-operations";
import { createReferenceMenu } from "./reference-menu";
import type { ReferenceKind } from "./reference-window-services";
import { tauriFileServices } from "./tauri-file-services";
import { destroyCurrentWindow, promptUnsavedChanges } from "./tauri-window-services";
import { resolveUnsavedChanges } from "./unsaved-changes";
import type { ViewMode } from "./view-preferences";

const kind: ReferenceKind = new URLSearchParams(location.search).get("kind") === "examples" ? "examples" : "readme";
const shell = document.querySelector<HTMLElement>(".reference-shell")!;
const workspace = document.querySelector<HTMLElement>("#reference-workspace")!;
const editorPanel = document.querySelector<HTMLElement>("#reference-editor-panel")!;
const editor = document.querySelector<HTMLTextAreaElement>("#reference-editor")!;
const preview = document.querySelector<HTMLElement>("#reference-preview")!;
const title = document.querySelector<HTMLElement>("#reference-title")!;
const status = document.querySelector<HTMLElement>("#reference-status")!;
const actions = document.querySelector<HTMLElement>("#example-actions")!;
const lifecycle = new DocumentLifecycle();
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const baseline = kind === "examples" ? bundledExamples : bundledReadme;
let view: ViewMode = kind === "examples" ? "both" : "preview";
let swapped = false;

shell.dataset.kind = kind;
title.textContent = kind === "examples" ? "Markdown Examples" : "README";
actions.hidden = kind !== "examples";
lifecycle.loadBundledSample(baseline, kind === "examples" ? "Markdown Examples.md" : "README.md");

function render() {
  const snapshot = lifecycle.snapshot;
  editor.value = snapshot.content;
  preview.innerHTML = renderer.render(snapshot.content);
  workspace.dataset.view = view;
  workspace.dataset.swapped = String(swapped);
  editorPanel.hidden = kind === "readme";
  status.textContent = kind === "examples" && snapshot.dirty ? "Unsaved example changes" : "";
  document.title = `${snapshot.dirty ? "• " : ""}${title.textContent} — QuickMark`;
}

editor.addEventListener("input", () => { lifecycle.edit(editor.value); render(); });
globalThis.QuickMarkEditor.installMarkdownEditorBehavior(editor);
globalThis.QuickMarkMarkdown.installCodeCopyHandler(preview, (message) => { status.textContent = message; });

async function saveAs() {
  const outcome = await saveDocument(lifecycle, tauriFileServices, { saveAs: true });
  status.textContent = outcome.message;
  render();
}

const closeDependencies = {
  isDirty: () => lifecycle.snapshot.dirty,
  displayName: () => lifecycle.snapshot.displayName,
  prompt: promptUnsavedChanges,
  save: () => saveDocument(lifecycle, tauriFileServices, { saveAs: true }),
};

async function reset() {
  const decision = await resolveUnsavedChanges("Reset examples", closeDependencies);
  if (decision.status !== "proceed") { status.textContent = decision.message; return; }
  lifecycle.loadBundledSample(baseline, "Markdown Examples.md");
  render();
}

document.querySelector("#save-examples-as")?.addEventListener("click", () => void saveAs());
document.querySelector("#reset-examples")?.addEventListener("click", () => void reset());

render();

async function initializeReferenceWindow() {
  const menu = await createReferenceMenu(kind, {
    saveAs: () => void saveAs(), reset: () => void reset(), print: () => globalThis.print(),
    close: () => void getCurrentWindow().close(),
    setView: (mode) => { view = mode; render(); }, swap: () => { swapped = !swapped; render(); },
  });
  await getCurrentWindow().onFocusChanged(({ payload }) => { if (payload) void menu.activate(); });
  await getCurrentWindow().onCloseRequested(async (event) => {
    if (kind !== "examples" || !lifecycle.snapshot.dirty) return;
    event.preventDefault();
    const decision = await resolveUnsavedChanges("Close", closeDependencies);
    status.textContent = decision.status === "proceed" ? "" : decision.message;
    if (decision.status === "proceed") await destroyCurrentWindow();
  });
}

void initializeReferenceWindow().catch((error) => { status.textContent = `Could not initialize reference window: ${String(error)}`; });
