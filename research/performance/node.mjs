import { mkdirSync, writeFileSync, appendFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import os from "node:os";
import { Worker } from "node:worker_threads";
import MarkdownIt from "markdown-it";
import "../../shared/markdown-renderer.js";
import { generateMarkdownTable, insertMarkdownTable } from "../../src/table-builder.ts";
import { CASES, fixture, dimensions, summary } from "./fixtures.mjs";

const directory = resolve("research/performance/runs"); mkdirSync(directory, { recursive: true });
const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const output = resolve(directory, `${stamp}-node.jsonl`);
writeFileSync(output, "", { flag: "wx" });
const record = value => { appendFileSync(output, JSON.stringify(value) + "\n"); console.log(value.kind, value.name ?? ""); };
const renderer = globalThis.QuickMarkMarkdown.createMarkdownRenderer(MarkdownIt);
const assets = resolve("dist/assets");
const candidates = readdirSync(assets).filter(name => /^lint\.worker-.*\.js$/.test(name));
if (candidates.length !== 1) throw new Error("Build the normal frontend first; require exactly one production lint worker.");
const artifact = pathToFileURL(resolve(assets, candidates[0])).href;
async function lint(source) {
  const start = performance.now();
  const worker = new Worker(`import {parentPort} from "node:worker_threads";
    globalThis.self={postMessage:v=>parentPort.postMessage(v)};
    import(${JSON.stringify(artifact)}).then(()=>parentPort.on("message", data=>self.onmessage({data})));`,
    { eval: true, execArgv: ["--input-type=module"] });
  return new Promise(resolveResult => {
    let finished = false;
    const finish = value => { if (finished) return; finished = true; clearTimeout(timer); worker.terminate(); resolveResult({ ms: performance.now() - start, ...value }); };
    const timer = setTimeout(() => finish({ timeout: true }), 10_000);
    worker.on("error", error => finish({ error: String(error) }));
    worker.on("message", value => finish(value.error ? { error: value.error } : { findings: value.issues.length }));
    worker.postMessage({ requestId: 1, source });
  });
}
record({ kind: "environment", node: process.version, platform: process.platform, cpu: os.cpus()[0].model, totalMemory: os.totalmem(), artifact: candidates[0] });
for (const name of CASES) {
  const source = fixture(name); const times = [], tables = [], workers = [];
  const repeats = ["mixed-256k", "mixed-1m"].includes(name) ? 6 : 2;
  for (let i = 0; i < repeats; i++) {
    let start = performance.now(); renderer.render(source, { sourceMap: true }); const render = performance.now() - start;
    start = performance.now();
    const table = generateMarkdownTable({ headers: Array(20).fill("Header"), alignments: Array(20).fill("left"), bodyRows: 100 });
    insertMarkdownTable(source, source.length / 2, source.length / 2, table);
    if (i) { times.push(render); tables.push(performance.now() - start); }
  }
  record({ kind: "components", name, ...dimensions(source), render: summary(times), table: summary(tables), memory: process.memoryUsage() });
  for (let i = 0; i < repeats; i++) {
    const result = await lint(source); if (i || result.timeout || result.error) workers.push(result);
    if (result.timeout || result.error) break;
  }
  record({ kind: "lint", name, samples: workers });
}
record({ kind: "done" }); console.log(output);
