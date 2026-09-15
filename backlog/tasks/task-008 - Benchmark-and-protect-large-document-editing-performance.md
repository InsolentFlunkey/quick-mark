---
id: TASK-008
title: Benchmark and protect large-document editing performance
status: Done
assignee:
  - Codex
created_date: '2026-08-29 20:57'
updated_date: '2026-09-15 00:37'
labels:
  - enhancement
  - performance
dependencies:
  - TASK-014
documentation:
  - research/performance/findings.md
  - research/performance/baseline/measurements.md
  - >-
    backlog/docs/research/performance/doc-012 -
    Large-document-performance-baseline-and-review-budgets.md
priority: medium
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Measure QuickMark’s behavior with realistically large and structurally varied Markdown documents, then establish performance budgets or safeguards for editing, rendering, synchronized scrolling, table operations, and future linting. The current application rerenders and may rebuild source mappings during edits, but no documented large-document baseline exists.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Representative large-document fixtures and repeatable measurement scenarios are documented
- [x] #2 Editing latency, preview rendering, synchronized-scroll mapping, memory use, and window responsiveness are measured at agreed document sizes
- [x] #3 Performance budgets or clearly justified thresholds are recorded for future features
- [x] #4 Material bottlenecks discovered by the benchmark are documented with an approved disposition
- [x] #5 Automated regression coverage protects the most important measurable performance characteristics without creating flaky timing tests
- [x] #6 The results explicitly inform whether and how optional real-time linting can run safely
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
User-approved measurement plan — implementation, automated verification and final user review complete.

1. Add deterministic fixture generation and a repeatable benchmark runner under scripts/research, with no dependency on external image/link loading. Normal workloads: 256 KiB and 1 MiB mixed prose, headings/section links, nested lists, fenced code and tables. Stress workloads: 5 MiB mixed Markdown, 50,000 short lines, one 200,000-character wrapped line, and a dense table/many-findings case. Record actual UTF-8 bytes, UTF-16 characters, line counts, rendered nodes and source-map anchors; generate bulky fixtures on demand rather than committing megabytes.
2. Measure components independently using production renderer/scroll/table/lint modules, then measure integrated Windows WebView2 interactions using an opt-in diagnostic benchmark build/harness and process-memory sampling. The normal shipped UI/settings remain unchanged. Separate Node algorithm/worker timings from native layout/paint and process memory. Confirm native instrumentation access before relying on it; report unavailable metrics or tooling as blockers rather than substituting jsdom timings for native evidence.
3. Normal-size scenarios: first render and repeated edits near start/middle/end, Input-only vs Split, Sync Scrolling on/off, initial/rebuilt mapping vs cached scrolling, tab switching with three documents, 20-column x 100-row table generation/insertion, lint completion/cancellation and typing/tab switching during lint. Preview-only covers rendering/scrolling rather than typing into a hidden editor. Stress runs proceed progressively, record timeouts/failures honestly and stop escalating an unresponsive case.
4. Use a warm-up plus five measured repetitions where feasible; preserve raw samples, median, max and environment details rather than claiming precise tail percentiles from few runs. Record input-dispatch-to-next-presented-frame approximation, render/DOM/layout/map durations, frame/long-task stalls, lint completion/cancel latency, and native process-tree working-set/private-memory baseline, peak and post-close behavior. Label synthetic input and paint approximations; include user native typing/scroll responsiveness review.
5. Propose initial review budgets, not existing performance claims: <=100 ms edit-to-frame for normal-size documents, <=50 ms main-thread blocking segments, approximately one display frame for cached scroll work, and <=250 ms cancel feedback when the main thread is responsive. Keep the current 10-second lint timeout. Set defensible size-specific memory and stress thresholds from measured baselines, documenting tradeoffs and supported test conditions. No arbitrary document truncation, raised timeouts or silent disabled features.
6. Add deterministic regression checks for meaningful invariants and bounded/coalesced work where existing architecture supports them, not CI wall-clock assertions. Document measured bottlenecks with proposed dispositions for user review before optimizations or follow-up implementation. Record the results/budgets/real-time-lint recommendation in a Backlog research doc with reproducible commands and native checklist. Run affected tests and required build checks. Do not implement TASK-011 or unrelated performance fixes; do not mark Done until measurements and bottleneck dispositions are complete.

Final user review completed: ordinary 1 MiB editing is responsive and lint finishes immediately from the user's perspective. Accepted disposition is to retain diagnostic evidence/budgets, reconcile synthetic measurements before prioritizing optimization, and require no further manual stress checks for this task. User authorized commit and push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User approved starting recommended TASK-008 after TASK-010 completion. Working tree was clean; no root user-notes.md. Existing benchmark only exercises the production lint worker at 1/5 MiB, 50k lines and one long line. Inspection confirms each input calls renderDocument synchronously, replacing Preview HTML and invalidating scroll mapping; mapping uses a hidden source mirror and native DOM layout reads. Lint runs in a worker with a 10-second timeout; table builder allows up to 20 columns/100 rows. These are measurement targets, not yet measured bottlenecks. No benchmark/application code written before plan review.

User approved the measurement plan and document sizes. Proceeding with benchmark tooling and native measurement feasibility checks.

Native feasibility proven: the opt-in benchmark build runs in actual WebView2 with a separate app identifier and reports checkpoints through a feature-gated native event sink to a fixed create-new JSONL file. No CDP/debugging port, network exception, new dependency or production UI hook was needed. Windows hardware/process queries required sandbox escalation and succeeded; native run plus process-tree memory sampling are underway. The first run is also validating the harness; do not treat incomplete samples as a final baseline.

First complete native run (native-first) and Node component/worker run preserved under research/performance/runs. Native visibility was visible, viewport 1100x740 at 150% DPI on Windows 11 26200, i7-13620H/16 logical processors/~64 GiB RAM. Initial observations: 1 MiB Split edit-to-two-rAF latency around 0.8–1s; 5 MiB rendering stalls for seconds and lint times out. Node and native runs were sequential, not concurrent.

Harness correction: editing intentionally cancels/invalidate in-flight lint, so first run's lint-ui rows=0 measured cancellation rather than batch rendering. Added a fresh uninterrupted run for batch rendering, real Cancel button measurements, a 100ms worker-start allowance, and tab switching during lint; rerunning native baseline. Full frontend suite passes 336 tests, benchmark TypeScript check passes; formatting correction applied to native telemetry sink.

Separate bug discovered in shipped TASK-010.05: src/lint-state.ts still labels results quickmark-1 while native transfer accepts quickmark-2, potentially rejecting detached tabs with lint state. Reported candidly and requested permission to track/fix separately; no production correction made as part of performance work. Benchmark worker still runs the current renderer-aligned profile.

User authorized separate profile bug tracking and its implementation after TASK-008; created TASK-010.05.01 (high priority) with identity, completed/stale transfer and cross-layer/native verification criteria. Its implementation remains unstarted.

Measurement audit found full-text textarea assignment in the initial edit loop. Retained those runs as calibration; final baseline changes only one character via setRangeText followed by the real input handler. Initial document loads still intentionally assign full content. This avoids presenting whole-buffer assignment overhead as normal keystroke latency.

Final native-single-edit baseline and raw traces retained in research/performance/baseline, with reproduction guide and findings; doc-012 preserves measurement decisions and proposed dispositions. Normal-size Split edit medians: 256 KiB 205–250ms; 1 MiB 869–1059ms. 5 MiB first-frame approximation 4094ms; 5 MiB/50k-line lint reaches existing timeout. Cancel UI 10–24ms; initial result rows bounded to 200. Ordered process-tree private-byte peak 5541MiB; not evidence of a leak by itself.

Final verification: 336 frontend tests, 50 Rust tests with benchmark feature, benchmark TypeScript check, Rust formatting, production-worker isolation check and ordinary Windows standalone debug rebuild all pass. Ordinary frontend assets contain no benchmark hooks; normal executable restored. No root user-notes.md. Acceptance criterion 4 remains pending explicit review of proposed bottleneck dispositions; native human typing/scroll review also remains pending. No performance optimization or profile-version bug fix included.

Manual review did not reproduce synthetic lag: almost no editing delay including 1 MiB, and lint completes before cancellation can be observed. Source inspection confirms Cancel Lint is hidden unless running. Recorded this evidence and the unexplained measurement discrepancy in findings.md/doc-012; no claim of confirmed ordinary-app latency regression. User accepted completion and authorized commit/push. Created requested TASK-010.02.01 for clearer loaded/total counts and highlighted Load More; implementation remains To Do.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Add deterministic large-document fixtures, repeatable Node/native WebView2 benchmark tooling, retained raw measurements, review budgets and bounded-work regression tests. Native instrumentation is opt-in and excluded from normal builds.

Automated measurements expose expensive diagnostic workloads, but user review finds ordinary editing responsive even at 1 MiB and lint effectively immediate. Retain both observations; reconcile the synthetic workload before prioritizing optimization. No production performance behavior changed. Follow-up profile identity bug and lint pagination UX are separately tracked.

Verified: 336 frontend tests, 50 Rust tests, benchmark TypeScript, Rust formatting, production worker isolation and ordinary Windows debug build. User manual review accepted; all acceptance criteria satisfied.
<!-- SECTION:FINAL_SUMMARY:END -->
