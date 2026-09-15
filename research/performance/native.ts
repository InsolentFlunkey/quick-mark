import MarkdownIt from "markdown-it";
import { emit } from "@tauri-apps/api/event";
import { measureScrollAnchors } from "../../src/scroll-sync";
import { generateMarkdownTable, insertMarkdownTable } from "../../src/table-builder";
import { LintClient } from "../../src/lint-client";
import { fixture, dimensions, summary, CASES } from "./fixtures.mjs";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const frames = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const editor = () => document.querySelector<HTMLTextAreaElement>("#editor")!;
const preview = () => document.querySelector<HTMLElement>("#preview")!;
const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === label)!;
const record = (value: object) => emit("quickmark-benchmark", { at: Date.now(), ...value });
async function until(test: () => boolean, limit = 15_000) {
  const start = performance.now();
  while (!test()) {
    if (performance.now() - start > limit) throw new Error("Native benchmark condition timed out");
    await delay(25);
  }
}
function input(source: string, position = 0) {
  editor().value = source; editor().setSelectionRange(position, position);
  editor().dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "x" }));
}
function editRange(text: string, start: number, end: number) {
  editor().setRangeText(text, start, end, "end");
  editor().dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}
async function timing(action: () => void) {
  const start = performance.now(); action(); const synchronous = performance.now() - start;
  await frames(); return { synchronous, frame: performance.now() - start };
}
export async function runBenchmark(hooks: {
  ready(): boolean; setView(mode: "both" | "input" | "preview", sync: boolean): void;
  refresh(): void; exitLint(): void;
}) {
  const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
  const tasks: number[] = []; const gaps: number[] = [];
  let active = true; let previous = performance.now();
  const heartbeat = (now: number) => { if (now - previous > 50) gaps.push(now - previous); previous = now; if (active) requestAnimationFrame(heartbeat); };
  const observer = new PerformanceObserver(list => tasks.push(...list.getEntries().map(entry => entry.duration)));
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) observer.observe({ entryTypes: ["longtask"] });
  try {
    await until(hooks.ready); await delay(1000);
    await record({ kind: "environment", userAgent: navigator.userAgent, visibility: document.visibilityState,
      viewport: [innerWidth, innerHeight], devicePixelRatio, hardwareConcurrency: navigator.hardwareConcurrency,
      build: "standalone-debug-benchmark", measurements: "synthetic input, two-rAF paint approximation; not hardware key-to-photon" });
    await record({ kind: "stage", operation: "idle-memory" }); await delay(2000);
    requestAnimationFrame(heartbeat);
    for (const name of CASES) {
      const source = fixture(name);
      const normal = ["mixed-256k", "mixed-1m"].includes(name);
      await record({ kind: "stage", name, operation: "initial", ...dimensions(source) });
      hooks.exitLint(); hooks.setView("both", false); await frames();
      const initial = await timing(() => input(source));
      await record({ kind: "initial", name, ...initial, nodes: preview().querySelectorAll("*").length,
        anchors: preview().querySelectorAll("[data-source-line]").length });
      // Protect the measurement session, without changing document limits or app behavior.
      if (initial.frame > 15_000) {
        await record({ kind: "case-stopped", name, reason: "initial frame exceeded 15-second stress stop threshold" });
        input(""); await frames(); continue;
      }
      const parse: number[] = [], dom: number[] = [], layout: number[] = [], map: number[] = [];
      for (let i = 0; i < (normal ? 6 : 2); i++) {
        await record({ kind: "stage", name, operation: "components", repetition: i });
        let start = performance.now(); const html = renderer.render(source, { sourceMap: true }); const p = performance.now() - start;
        start = performance.now(); preview().innerHTML = html; const d = performance.now() - start;
        start = performance.now(); void preview().scrollHeight; const l = performance.now() - start;
        start = performance.now(); const mapping = measureScrollAnchors(editor(), preview(), source); const m = performance.now() - start;
        if (!mapping.points.length) throw new Error("Missing mapping points");
        if (i > 0) { parse.push(p); dom.push(d); layout.push(l); map.push(m); }
        await frames();
        if (p + d + l + m > 15_000) break;
      }
      await record({ kind: "components", name, parse: summary(parse), dom: summary(dom), layout: summary(layout), map: summary(map) });
      if (normal) {
        for (const mode of ["input", "both"] as const) for (const sync of [false, true]) {
          hooks.setView(mode, sync); await frames();
          for (const position of ["start", "middle", "end"]) {
            const syncTimes: number[] = [], frameTimes: number[] = [];
            const offset = position === "start" ? 0 : position === "end" ? source.length : Math.floor(source.length / 2);
            input(source); editRange("x", offset, offset); await frames();
            await record({ kind: "stage", name, operation: "editing", mode, sync, position });
            for (let i = 0; i < 6; i++) {
              const result = await timing(() => editRange(i % 2 ? "x" : "y", offset, offset + 1));
              if (i > 0) { syncTimes.push(result.synchronous); frameTimes.push(result.frame); }
            }
            await record({ kind: "editing", name, mode, sync, position, synchronous: summary(syncTimes), frame: summary(frameTimes) });
          }
        }
        hooks.setView("both", true); input(source); await frames();
        const scrolling: number[] = [];
        for (let i = 0; i < 6; i++) {
          const t = await timing(() => { editor().scrollTop = (editor().scrollHeight - editor().clientHeight) * (i % 2 ? .7 : .3); editor().dispatchEvent(new Event("scroll")); });
          if (i > 0) scrolling.push(t.frame);
        }
        await record({ kind: "cached-scroll", name, frame: summary(scrolling) });
        hooks.setView("preview", false); await frames();
        await record({ kind: "preview-only", name, ...(await timing(() => { preview().scrollTop = preview().scrollHeight / 2; })) });
        hooks.setView("both", false); input(source); await frames();
        const generated = generateMarkdownTable({ headers: Array.from({ length: 20 }, (_, i) => `C${i}`), alignments: Array(20).fill("left"), bodyRows: 100 });
        await record({ kind: "table-insertion", name, ...(await timing(() => input(insertMarkdownTable(source, source.length / 2, source.length / 2, generated).content))) });
      }
      hooks.setView("both", false); input(source); await frames();
      await record({ kind: "stage", name, operation: "worker" });
      const client = new LintClient(); let start = performance.now();
      try { const issues = await client.run(source); await record({ kind: "lint", name, ms: performance.now() - start, count: issues.length }); }
      catch (error) { await record({ kind: "lint", name, ms: performance.now() - start, error: String(error) }); }
      const canceled = client.run(source).then(() => "completed before cancellation", error => String(error));
      await delay(100); start = performance.now(); client.cancel();
      await record({ kind: "cancel-worker", name, ms: performance.now() - start, result: await canceled });
      if (normal || name === "dense-table") {
        await record({ kind: "stage", name, operation: "lint-ui" });
        document.querySelector<HTMLButtonElement>("#lint-document")!.click();
        await until(() => !!button("Cancel Lint") && !button("Cancel Lint").hidden);
        await delay(100);
        const wasRunning = !button("Cancel Lint").hidden;
        // Exercise the actual editing path while the UI owns a lint request.
        const concurrent = await timing(() => editRange("\n", editor().value.length, editor().value.length));
        await record({ kind: "edit-during-lint", name, wasRunning, ...concurrent });
        await until(() => button("Cancel Lint").hidden, 20_000);
        // An edit intentionally invalidates/cancels results. Run a fresh check
        // without edits to measure completion and actual result batching.
        start = performance.now(); button("Run Again").click();
        await until(() => button("Cancel Lint").hidden, 20_000);
        await record({ kind: "lint-ui", name, rows: document.querySelectorAll(".lint-issues li").length,
          ms: performance.now() - start,
          status: document.querySelector(".lint-panel [role=status]")?.textContent });
        if (document.querySelectorAll(".lint-issues li").length > 200) throw new Error("Initial lint rows exceed 200");
        button("Run Again").click(); await delay(100);
        const available = !button("Cancel Lint").hidden;
        start = performance.now(); if (available) button("Cancel Lint").click(); await frames();
        await record({ kind: "cancel-ui", name, available, ms: performance.now() - start });
        hooks.exitLint();
      }
      input(""); await frames(); await delay(500);
      await record({ kind: "case-complete", name, visibility: document.visibilityState });
    }
    // Three retained documents and repeated tab switches through the real controls.
    const tabs = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    for (let i = 0; i < 3; i++) {
      if (i) document.querySelector<HTMLButtonElement>("#new-document")!.click();
      input(fixture("mixed-1m")); await frames();
    }
    await record({ kind: "stage", operation: "three-documents-memory" }); await delay(1500);
    const switches: number[] = [];
    for (let i = 0; i < 6; i++) { const result = await timing(() => tabs()[i % 3].click()); if (i) switches.push(result.frame); }
    await record({ kind: "tab-switch", frame: summary(switches) });
    document.querySelector<HTMLButtonElement>("#lint-document")!.click(); await delay(100);
    const duringLint = await timing(() => tabs()[1].click());
    await record({ kind: "tab-switch-during-lint", ...duringLint });
    await delay(1500); hooks.exitLint();
    // Clear generated text before using Close so no unsaved-change dialog is bypassed.
    for (let i = 0; i < 3; i++) {
      input(""); await frames();
      document.querySelector<HTMLButtonElement>('.document-tab[data-active="true"] [data-close]')!.click();
      await delay(150); await frames();
    }
    await record({ kind: "stage", operation: "post-close-memory" }); await delay(2000);
    active = false; observer.disconnect();
    await record({ kind: "done", longTasks: summary(tasks), frameGapsOver50ms: summary(gaps) });
  } catch (error) {
    active = false; observer.disconnect();
    await record({ kind: "failed", error: String(error), longTasks: summary(tasks), frameGapsOver50ms: summary(gaps) });
  }
}
