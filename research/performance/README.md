# Large-document benchmarks

These tools measure QuickMark; they do not change its document limits, timeout,
render scheduling, or shipped UI. TASK-008 owns the baseline and dispositions.

## Inputs and sampling

`fixtures.mjs` creates deterministic mixed Markdown at **at least** 256 KiB,
1 MiB and 5 MiB, ending on a complete block. Each block contains Unicode prose,
headings/section links, nested lists, quotes, code and tables. Other cases have
50,000 newline-terminated short lines, a 200,000-character wrapped line, or a
10,000-row table with missing section destinations. There are no fetched assets.
Results report exact UTF-8 bytes, UTF-16 characters, lines, DOM nodes and anchors.

Normal component/edit scenarios use one warm-up plus five samples. Stress
component scenarios use one warm-up plus one sample to limit repeated pressure.
First render, stress lint and UI interactions are individual observations.
Keep raw samples; median and maximum are descriptive, not tail percentiles.

## Node components and worker

From the repository root, after `npm run build`:

```powershell
node --experimental-strip-types research/performance/node.mjs
```

This uses the real renderer/table functions and compiled worker. It records
render-string creation, table generation/insertion, worker completion including
startup, and process memory snapshots. It does **not** measure DOM layout,
typing responsiveness, native memory or native cancellation. A lint timeout is
recorded honestly at the existing 10-second limit, and that case is not repeated.

## Native Windows WebView2

Build the isolated diagnostic app, then run the sampler:

```powershell
npm.cmd run tauri -- build --debug --no-bundle --features benchmark --config research/performance/tauri.conf.json -- --locked
./research/performance/run-native.ps1
```

The benchmark identity `app.quickmark.benchmark` has separate settings/WebView
storage from QuickMark. It creates only synthetic unsaved documents. The Vite
transform appends a harness to the real editor entry only in this diagnostic
build. A Rust feature-gated event sink writes to the fixed output path supplied
by the runner; it never accepts an output path from rendered content. Output
creation is exclusive; choose a new `-RunName` for repeat runs. No remote
debugging port, CSP relaxation or broad filesystem capability is added.

The runner starts only its own process, samples its process tree roughly once
per second, and preserves JSONL checkpoints in ignored `runs/`. It stops its
own process tree if no checkpoint arrives for 90 seconds. This watchdog is a
measurement limit, not a change to the app. Failed/partial runs remain available
and must not be combined with successful runs as if they completed.

Record the reported visibility, viewport, DPI, CPU, RAM, OS and runtime. Keep the
window unobscured and avoid interacting with it or running builds/tests during
collection. Background/hidden-window measurements must be labeled, not treated
as foreground latency. The tested executable uses a debug Rust build with a
Vite production frontend; timings are specific to this setup.

For initial loads, `synchronous` covers assigning textarea content and dispatching
an input event. Repeated edits use one-character `setRangeText` replacements and
synthetic input events through the real handlers, not whole-buffer replacements.
`frame` adds two animation-frame callbacks as
a paint opportunity approximation. It includes scheduling and layout; it is
not a hardware keyboard-to-photon measurement. Component parser, DOM replacement,
forced layout and scroll-map measurements separate costs. Cached-scroll `frame`
also includes the two-frame measurement floor, not just interpolation work.
Long-task/frame-gap observations include deliberate component probes as well as
integrated interactions, and cannot all be attributed to typing.

Memory totals sum working sets/private bytes for QuickMark and its descendants.
Shared pages can be double-counted in working-set sums; the process tree includes
browser, renderer, GPU and utilities. Samples are not exact allocation peaks.
After-close samples show short-term retention, not proof of a memory leak; no
forced garbage collection or cache purge is performed. Sequential workloads can
retain high-water allocations. Compare equivalent sequences and fresh launches.

After benchmarking, restore the ordinary standalone executable and assets:

```powershell
npm.cmd run tauri -- build --debug --no-bundle -- --locked
```

## Manual review and regression checks

Generate the same files once with
`node research/performance/generate-fixtures.mjs`. It refuses to overwrite files.
In the ordinary app, use **File → Open** on `runs/fixtures/mixed-256k.md`, then
`mixed-1m.md`. In **View → Split**, type near the beginning, middle and end;
observe delayed characters/Preview updates. Toggle **View → Sync Scrolling**
and compare scrolling. Choose **View → Input** and compare typing again. Run
**Lint**, try typing/switching tabs, and use **Cancel Lint** while available.
Save only if you want to retain edits. Test 5 MiB last, stopping if unresponsive.

`tests/performance-contracts.test.ts` checks fixture fidelity, logarithmic cached
mapping and coalesced/reused geometry. It uses deterministic operation counts,
not machine-speed timing assertions. Existing lint client/results tests protect
worker cancellation/timeouts and bounded result rendering. New optimization work
requires a separately approved disposition after reviewing the measurements.
