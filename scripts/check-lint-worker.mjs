import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";

// Execute the actual production artifact in a DOM-free worker. This catches
// browser export conditions that compile but require document at runtime.
const file = resolve("dist/assets", readdirSync("dist/assets").find(name => name.startsWith("lint.worker-")));
async function run(source, timeout = 10000) {
  const worker = new Worker(`
    import { parentPort } from "node:worker_threads";
    globalThis.self = { postMessage: value => parentPort.postMessage(value) };
    import(${JSON.stringify(file)}).then(() => {
      parentPort.on("message", data => self.onmessage({ data }));
    });
  `, { eval: true, execArgv: ["--input-type=module"] });
  return new Promise((resolveResult, reject) => {
    const timer = setTimeout(() => { worker.terminate(); resolveResult({ timedOut: true }); }, timeout);
    worker.on("error", error => { clearTimeout(timer); worker.terminate(); reject(error); });
    worker.on("message", result => { clearTimeout(timer); worker.terminate(); resolveResult(result); });
    worker.postMessage({ requestId: 1, source });
  });
}
const clean = await run("# Title\n\nText with &amp; and &copy;.\n");
assert.deepEqual(clean.issues, []);
const issues = await run("# Title\n# Other\n\n[text]()\n");
assert(issues.issues.some(issue => issue.rule === "MD025"));
assert(issues.issues.some(issue => issue.rule === "MD042"));
console.log("Production worker: clean, entities and issue checks passed without DOM globals.");
if (process.argv.includes("--benchmark")) {
  const block = "## Section\n\nSome **bold** text and a [link](https://example.com).\n\n- One\n- Two\n\n```js\nconst x = 1;\n```\n\n";
  const cases = [
    ["1 MiB", block.repeat(Math.ceil(1048576 / block.length))],
    ["5 MiB", block.repeat(Math.ceil(5242880 / block.length))],
    ["50000 lines", "line\n".repeat(50000)],
    ["long line", "x ".repeat(100000)],
  ];
  for (const [name, source] of cases) {
    const start = performance.now(); const result = await run(source);
    console.log(name, `${Math.round(performance.now() - start)}ms`, result.timedOut ? "timeout" : result.error ?? `${result.issues.length} issues`);
  }
}
