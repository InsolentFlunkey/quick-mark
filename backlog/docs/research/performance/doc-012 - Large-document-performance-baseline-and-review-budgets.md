---
id: doc-012
title: Large-document performance baseline and review budgets
type: specification
created_date: '2026-09-14 02:09'
updated_date: '2026-09-15 00:37'
tags:
  - performance
  - task-008
  - windows
  - baseline
---
# Large-document performance baseline

TASK-008 measurement deliverable; user manual review accepted completion. The user approved the workload/measurement plan before implementation.

## Evidence and reproduction

Application base revision: 35ed432, plus opt-in diagnostic instrumentation. Actual Windows 11 Pro 26200/WebView2 152 run on i7-13620H, 16 logical processors, 63.7 GiB usable RAM; visible viewport 1100x700 at 150% DPI. Debug Rust executable with production Vite frontend. Node and native runs were sequential. No Linux or physical key-to-photon claims.

Repository artifacts: research/performance/README.md (methodology/commands), fixtures.mjs and generate-fixtures.mjs (deterministic inputs), native.ts/vite.config.ts/tauri.conf.json/run-native.ps1 (isolated native run), node.mjs (Node parser/table/production-worker measurements), summarize.mjs, findings.md, and baseline/ containing final raw native/memory/Node traces and measurements.md. Generated large fixture files and calibration runs stay ignored under runs/.

Final native inputs: 262864/1049259/5243319-byte mixed documents; 550000-byte/50000-newline document; 200000-character wrapped line; 397826-byte/10000-row table. Mixed documents include Unicode prose, headings/section links, nested lists, quotes, tables and code, with no remote assets. Repeated edits use one-character setRangeText replacements and real input handlers. One warm-up plus five samples per normal position/view/sync case; stress components use one warm-up plus one sample. Preserve raw values, medians/maxima; no p95/p99 claim.

## Results

256 KiB repeated-edit median: Input 85–91ms, Split 205ms with sync off / 250ms on. 1 MiB: Input 363–365ms, Split 869ms off / 1059ms on. At 1 MiB, isolated parser/DOM/layout/map medians are 77/86/350/198ms. These are separate probes, not an exact additive decomposition of edit latency.

5 MiB creates 212370 DOM nodes; first paint opportunity is about 4094ms, standalone forced layout 2304ms and map rebuilding 1487ms. Both the 5 MiB and 50000-line native lint runs hit the unchanged 10-second timeout. Native dense-table lint completes in about 6056ms; wrapped-line lint about 147ms. Node results differ (including dense-table timeout), reinforcing that Node timings do not replace native measurements.

Uninterrupted lint UI runs start with 200 rows. Cancel feedback was 10–24ms while available. Source edits cancel/invalidate lint by existing design; a separate uninterrupted run measured actual results. Three-tab switching median was 780ms; a switch during lint took 903ms.

The sequential process-tree sample peaked at 5541 MiB private bytes (about 5.4 GiB), compared with an idle sample of 207 MiB and a shortly-after-close sample of 2401 MiB. This is not leak proof: no forced GC, shared working-set pages, allocator high-water retention, and browser/GPU/utility processes all matter. Per-case intervals and proposed baseline-relative memory alerts are in measurements.md.

## Proposed budgets and dispositions

Retain targets of <=100ms normal edit-to-paint-opportunity, <=50ms main-thread segments, cached scrolling work within a display frame, and <=250ms Cancel feedback when the main thread can process input. Two-rAF measurements have a scheduling floor; they are not physical input latency. Keep the 10-second lint timeout.

Recommend separate follow-up implementation for (1) full/hidden Preview work during edits, (2) source-map rebuild/reuse, and (3) lint scalability plus memory profiling. Do not silently optimize, truncate documents, disable features, raise timeouts or force cache clearing to make benchmarks pass. For same-machine/same-sequence memory comparisons, investigate increases above a case's observed private-byte peak plus max(25%,128MiB). These are review alerts, not supported-file caps or desired UX levels. The benchmark alone stops escalating a first-frame case above 15 seconds and its runner stops its own process after 90 seconds without checkpoints.

Defer TASK-011 real-time linting until these costs have an approved disposition. A future design needs idle debounce, workers, bounded pending work, stale-result rejection and cancellation while preserving explicit manual/save behavior; worker execution alone cannot fix Preview/main-thread stalls.

## Isolation and verification

The benchmark uses a separate app identity/data directory and an opt-in Vite transform. A Rust benchmark feature writes native event checkpoints only to a fixed create-new file selected by the runner. No production hooks, new dependencies, CDP endpoint, CSP changes or expanded file capabilities. Windows CIM/process access required an approved sandbox escalation.

Deterministic regression tests protect fixture fidelity, logarithmic lookup over 100000 anchors and coalesced/reused scroll geometry; existing lint tests cover worker cancellation/timeouts and batched results. Full frontend suite passes 336 tests. Final native run completed without watchdog termination. Benchmark TypeScript verification passes. The ordinary Windows standalone debug rebuild passes and restores src-tauri/target/debug/quick-mark.exe without the benchmark feature. All 50 Rust tests pass with the optional benchmark feature; cargo fmt --check and the production worker DOM-isolation check pass. The ordinary frontend assets contain no benchmark hooks. Native human typing review is complete, with the discrepancy recorded below and in findings.md.

## Separate correctness issue

Created TASK-010.05.01 with user authorization: UI lint-state uses profile v1 while engine/native transfer expects v2, potentially rejecting detached lint-state tabs. The performance worker still uses current checks. User authorized fixing that bug after TASK-008; it has not been implemented in this task.

## Final user review and disposition

The user reports almost no lag in ordinary-app editing, including the 1 MiB fixture, and effectively immediate lint completion with no visible opportunity to cancel. Cancel Lint is only shown while a check is running. The user accepts performance testing and explicitly authorizes commit/push. No further manual stress testing is required. Synthetic harness delays were not reproduced by this review; their cause relative to ordinary use remains unestablished. Preserve both observations and reconcile the harness workload with ordinary interaction before prioritizing optimizations. The listed budgets remain review criteria, and performance investigations remain recommendations rather than confirmed user-visible defects or authorized implementation. Optional real-time linting remains separately scoped and needs its own bounded-work design and verification.

The user's separate pagination finding is captured in TASK-010.02.01: displayed lint range/total and a prominent Load More control. No pagination implementation is included here.
