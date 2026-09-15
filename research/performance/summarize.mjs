import { readFileSync, writeFileSync } from "node:fs";
import { summary } from "./fixtures.mjs";
const prefix = process.argv[2];
if (!prefix) throw new Error("Usage: node research/performance/summarize.mjs <path/prefix> [output.md]");
const load = suffix => readFileSync(`${prefix}-${suffix}.jsonl`, "utf8").replace(/^\uFEFF/, "").trim().split(/\r?\n/).map(JSON.parse);
const events = load("native"), memory = load("memory");
if (events.at(-1).kind !== "done") throw new Error("Incomplete run: review partial checkpoints separately.");
const env = events.find(e => e.kind === "environment");
const machine = memory.find(e => e.kind === "machine");
const mem = memory.filter(e => e.kind === "memory");
const fmt = n => Number.isFinite(n) ? Number(n).toFixed(1) : "—";
const mib = n => fmt(n / 1048576);
const get = (kind, name) => events.find(e => e.kind === kind && e.name === name);
const names = events.filter(e => e.kind === "initial").map(e => e.name);
const rows = names.map(name => {
  const initial = get("initial", name), c = get("components", name), lint = get("lint", name);
  return `| ${name} | ${initial.nodes} | ${fmt(initial.frame)} | ${fmt(c?.parse?.median)} | ${fmt(c?.dom?.median)} | ${fmt(c?.layout?.median)} | ${fmt(c?.map?.median)} | ${lint?.error ? lint.error.replaceAll("|", "/") : fmt(lint?.ms)} |`;
});
const editRows = [];
for (const name of ["mixed-256k", "mixed-1m"]) for (const mode of ["input", "both"]) for (const sync of [false, true]) {
  const matching = events.filter(e => e.kind === "editing" && e.name === name && e.mode === mode && e.sync === sync);
  const frames = summary(matching.flatMap(e => e.frame.samples));
  const calls = summary(matching.flatMap(e => e.synchronous.samples));
  editRows.push(`| ${name} | ${mode} | ${sync} | ${fmt(calls?.median)} | ${fmt(frames?.median)} | ${fmt(frames?.max)} |`);
}
const memoryRows = [];
for (const op of ["idle-memory", "three-documents-memory", "post-close-memory"]) {
  const marker = events.find(e => e.operation === op);
  const next = marker && events.find(e => e.at > marker.at);
  const samples = marker ? mem.filter(e => e.at >= marker.at && e.at <= (next?.at ?? Infinity)) : [];
  const last = samples.at(-1);
  memoryRows.push(`| ${op} | ${mib(last?.workingSet)} | ${mib(last?.privateBytes)} | ${samples.length} |`);
}
memoryRows.push(`| Entire-run sampled peak | ${mib(Math.max(...mem.map(e => e.workingSet)))} | ${mib(Math.max(...mem.map(e => e.privateBytes)))} | ${mem.length} |`);
const envelopes = names.map(name => {
  const start = events.find(e => e.kind === "stage" && e.name === name && e.operation === "initial");
  const end = events.find(e => ["case-complete", "case-stopped"].includes(e.kind) && e.name === name);
  const samples = mem.filter(e => e.at >= start.at && e.at <= end.at);
  const peak = Math.max(...samples.map(e => e.privateBytes));
  return `| ${name} | ${mib(peak)} | ${mib(peak + Math.max(peak * .25, 128 * 1048576))} |`;
});
const uiRows = events.filter(e => e.kind === "lint-ui").map(e => `| ${e.name} | ${fmt(e.ms)} | ${e.rows} | ${e.status} |`);
const cancellation = events.filter(e => e.kind === "cancel-ui").map(e => `| ${e.name} | ${e.available} | ${fmt(e.ms)} |`);
const text = `# Native performance measurements

Generated from ${prefix}-native.jsonl and its memory trace. Units: milliseconds unless noted.
Measured ${new Date(env.at).toISOString()} on ${machine.cpu.Name}, ${machine.cpu.NumberOfLogicalProcessors} logical processors;
${machine.os.Caption} ${machine.os.Version}, ${(machine.os.TotalVisibleMemorySize / 1024 / 1024).toFixed(1)} GiB usable RAM.
${env.build}; viewport ${env.viewport.join("×")}, scale ${env.devicePixelRatio}, visibility ${env.visibility}.
Runtime: ${env.userAgent}.

## Render and layout components

First frame is an integrated single observation. Component medians use five samples after warm-up for normal sizes,
one sample after warm-up for stress sizes. Lint includes worker startup and is one native observation.

| Fixture | DOM nodes | First frame | Parse | DOM replacement | Forced layout | Mapping | Lint |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows.join("\n")}

## Repeated editing

Fifteen samples per row: five each near the start, middle and end after warm-ups.
Two-rAF measurements approximate paint opportunity, not physical input-to-photon latency.

| Fixture | View | Sync | Handler median | Frame median | Frame max |
| --- | --- | --- | ---: | ---: | ---: |
${editRows.join("\n")}

## Memory

Process-tree sums, MiB. Shared working-set pages may be counted more than once.
Sequential workloads retain allocations; after-close measurements are not leak proof or per-document budgets.

| Stage | Working set | Private bytes | Samples in window |
| --- | ---: | ---: | ---: |
${memoryRows.join("\n")}

Proposed **review alerts**, not supported-file limits: investigate increases beyond
the observed per-case private-byte peak plus the greater of 25% or 128 MiB, using
the same ordered workload and fresh launch. The tolerance allows allocator and
sampling variability. It does not bless current high memory use as desirable.

| Fixture interval | Observed peak private MiB | Proposed alert MiB |
| --- | ---: | ---: |
${envelopes.join("\n")}

## Lint results and cancellation

| Fixture | UI completion | Initial rows | Status |
| --- | ---: | ---: | --- |
${uiRows.join("\n")}

| Fixture | Cancel available | Click-to-frame |
| --- | --- | ---: |
${cancellation.join("\n")}

Tab-switch median: ${fmt(events.find(e => e.kind === "tab-switch")?.frame?.median)} ms.
Tab switch during lint: ${fmt(events.find(e => e.kind === "tab-switch-during-lint")?.frame)} ms.
Total native long tasks: ${events.at(-1).longTasks?.samples.length ?? 0}; maximum ${fmt(events.at(-1).longTasks?.max)} ms.
These include deliberately synchronous component probes, not just editing.
`;
if (process.argv[3]) writeFileSync(process.argv[3], text); else console.log(text);
