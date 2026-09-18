import { emit } from "@tauri-apps/api/event";
import type { LintIssue } from "../../src/lint-profile";
import { fixture, dimensions, summary } from "../performance/fixtures.mjs";
import { lintDiagnostics } from "./diagnostics";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const frames = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const record = (value: object) => emit("quickmark-benchmark", { at: Date.now(), ...value });

async function timing(action: () => void) {
  const start = performance.now();
  action();
  const synchronous = performance.now() - start;
  await frames();
  return { synchronous, frame: performance.now() - start };
}

function syntheticIssues(lines: number, count: number): LintIssue[] {
  return Array.from({ length: count }, (_, index) => ({
    rule: index % 3 ? "POC-RANGE" : "POC-LINE",
    message: `Synthetic diagnostic ${index + 1}`,
    line: 1 + Math.floor(index * Math.max(1, lines - 1) / Math.max(1, count - 1)),
    column: index % 3 ? 2 : null,
    length: index % 3 ? 5 : null,
    detail: "CodeMirror decoration update measurement",
    context: "",
  }));
}

async function run() {
  const api = window.quickMarkCodeMirrorResearch;
  const editor = api.editor;
  const longTasks: number[] = [];
  const observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => entry.duration)));
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) observer.observe({ entryTypes: ["longtask"] });
  try {
    await delay(500);
    await record({ kind: "environment", userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight],
      devicePixelRatio, hardwareConcurrency: navigator.hardwareConcurrency,
      build: "codemirror-research-debug", measurements: "editor-only synthetic transactions and two-rAF paint approximation" });
    await record({ kind: "stage", operation: "idle-memory" }); await delay(1500);
    for (const name of ["mixed-256k", "mixed-1m"]) {
      const source = fixture(name);
      await record({ kind: "stage", name, operation: "initial", ...dimensions(source) });
      const initial = await timing(() => editor.replace(0, editor.view.state.doc.length, source, source.length));
      await record({ kind: "initial", name, ...initial,
        renderedLines: editor.view.contentDOM.querySelectorAll(".cm-line").length,
        documentLines: editor.view.state.doc.lines });

      const synchronous: number[] = [], frame: number[] = [];
      for (const offset of [0, Math.floor(source.length / 2), source.length - 1]) {
        for (let i = 0; i < 6; i++) {
          const result = await timing(() => editor.replace(offset, offset + 1, i % 2 ? "x" : "y"));
          if (i) { synchronous.push(result.synchronous); frame.push(result.frame); }
        }
      }
      await record({ kind: "editing", name, synchronous: summary(synchronous), frame: summary(frame) });

      const scroll: number[] = [];
      for (let i = 0; i < 6; i++) {
        const result = await timing(() => {
          editor.view.scrollDOM.scrollTop = (editor.view.scrollDOM.scrollHeight - editor.view.scrollDOM.clientHeight) * (i % 2 ? 0.75 : 0.25);
          editor.view.scrollDOM.dispatchEvent(new Event("scroll"));
        });
        if (i) scroll.push(result.frame);
      }
      await record({ kind: "scroll", name, frame: summary(scroll) });

      const count = name === "mixed-256k" ? 715 : 2841;
      const diagnostics = lintDiagnostics(editor.view.state.doc, syntheticIssues(editor.view.state.doc.lines, count));
      const decorated = await timing(() => editor.setDiagnostics(diagnostics));
      await record({ kind: "diagnostics", name, count, ...decorated });
      await timing(() => editor.setDiagnostics([]));
    }

    const million = fixture("mixed-1m");
    for (const id of ["one", "two", "three"]) {
      api.switchDocument(id);
      editor.replace(0, editor.view.state.doc.length, million, million.length);
      await frames();
    }
    await record({ kind: "stage", operation: "three-documents-memory" }); await delay(1500);
    const switches: number[] = [];
    for (let i = 0; i < 6; i++) {
      const result = await timing(() => api.switchDocument(["one", "two", "three"][i % 3]));
      if (i) switches.push(result.frame);
    }
    await record({ kind: "tab-switch", frame: summary(switches) });
    observer.disconnect();
    await record({ kind: "done", longTasks: summary(longTasks) });
  } catch (error) {
    observer.disconnect();
    await record({ kind: "failed", error: String(error), longTasks: summary(longTasks) });
  }
}

void run();
