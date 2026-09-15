# Performance baseline findings and proposed dispositions

TASK-008 measures the existing implementation. No renderer, scheduler, lint
timeout, source-map policy, document cap or default setting has been optimized
or changed by this task. The native harness is excluded from ordinary builds.

Read [the measured tables](baseline/measurements.md), the retained raw traces in
`baseline/`, and [the reproduction guide](README.md). Preliminary `native-first`
and `native-baseline` runs under ignored `runs/` were harness calibration; the
committed `native-single-edit` trace is the final native baseline. The final edit
loop uses single-character replacements through the actual input handlers.

## Interpretation

Full-document Preview work is on the input path: `renderDocument` recreates the
rendered HTML and invalidates mapping for each edit. Input-only mode also invokes
the renderer and replaces the hidden Preview DOM. The component measurements
separate parser work, DOM insertion, forced layout and source-map rebuilding;
native layout/mapping costs cannot be inferred from Node parsing speed.

Turning off Sync Scrolling does not eliminate full Preview layout or the editor's
own text layout. Turning it on adds mapping and synchronization work. Native
frame measurements include painting opportunities and scheduling, so component
medians must not be summed and presented as an exact causal decomposition.

The 5 MiB fixture has over 200,000 rendered DOM nodes. Its visible layout and
mapping impose multi-second stalls. The 50,000-line and many-findings cases also
show that source structure matters, not just byte size. Worker linting can reach
the existing timeout; a clean result is never substituted for an incomplete run.

The initial lint result page remains bounded to 200 rows. Source edits cancel or
invalidate a running check by design; they do not preserve an actionable result
for old content. Separate uninterrupted runs measure actual row rendering.
Native Cancel-button observations and worker termination are distinct metrics.

Process-tree memory reaches several GiB during the ordered stress sequence and
can remain above idle shortly after documents close. This merits investigation,
but is not evidence of a leak: there is no forced GC, working-set sums can count
shared pages multiple times, and samples include browser/GPU/utility processes.
Use the raw private-byte trace and fresh-process repetitions when diagnosing it.

## Manual review and accepted disposition

The user tested the ordinary app and reported almost no editing lag, including
the 1 MiB file. Lint results appeared immediately, with no opportunity to use
Cancel Lint. That control is shown only while a check is running. The user
accepted performance testing and authorized completion, commit and push.

These observations do not reproduce the synthetic harness latency. Preserve
both sources of evidence: the harness uses an ordered diagnostic workload,
synthetic input and two animation frames, rather than physical typing latency.
The cause of the difference has not been established. No additional manual
stress test or immediate optimization is required to close this measurement
task. Reconcile ordinary-app and harness behavior before prioritizing any
performance change. The investigations below remain recommendations, not
confirmed user-visible defects or authorized implementation work.

Manual review also identified unclear lint result pagination, now tracked as
TASK-010.02.01: show the displayed range/total and emphasize Load More.

## Recorded budgets and future investigation recommendations

| Area | Target or review rule | Proposed disposition |
| --- | --- | --- |
| Editing 256 KiB / 1 MiB | Target at most 100 ms to a paint opportunity and no main-thread segment over 50 ms | Keep these responsiveness goals; record the current misses. Follow up on hidden Preview work and full-document update scheduling. |
| Cached synchronized scrolling | Work should fit within one display frame; retain logarithmic lookup and one scheduled update per burst | Preserve deterministic regression tests. Two-rAF end-to-end samples include a measurement floor and are not a direct frame-budget test. |
| Rebuilding source maps | Avoid blocking every edit on a full mapping rebuild; retain source/Preview accuracy | Investigate reuse, invalidation and demand-driven measurement as separate implementation work. |
| Lint cancellation | At most 250 ms click-to-feedback when the main thread can process input | Preserve cancellation and truthful timeout/error behavior. Do not raise the 10-second timeout to hide expensive cases. |
| Large lint workloads | Observe completion or explicit timeout; investigate poor scaling by document structure | Profile the 5 MiB, 50,000-line and dense-table cases before considering live lint. |
| Memory | Per-case review envelopes in the measured report: baseline private-byte peak plus max(25%, 128 MiB) for the same ordered workload | Treat increases as investigation triggers, not CI failures or acceptable UX limits. Profile allocation/retention; do not declare a leak or force cache clearing. |
| Stress runs | Preserve checkpoints; stop a case beyond the 15-second first-frame threshold or the process after 90 seconds without progress | These are benchmark controls only. No application file-size cap, truncation or automatic disabled feature is introduced. |

These budgets are initial engineering review criteria, not claims that QuickMark
currently meets them or guarantees for other computers. Five samples per normal
scenario do not justify p95/p99 claims or strict CI timing gates. Re-measure on
the same hardware, viewport, build type and fixture revision to compare changes.
Linux/WebKitGTK needs its own native baseline; these Windows results do not
establish Linux latency or memory behavior.

## Optional real-time linting

Defer TASK-011 until editing responsiveness and large lint workloads have an
approved implementation disposition. A future design should retain worker
execution, debounce idle input, allow only bounded pending work, reject stale
replies, cancel superseded work, and preserve the existing explicit save/manual
semantics. Repeated full parses of megabyte documents on each keystroke are not
supported by this baseline. Worker execution alone does not guarantee a
responsive UI when Preview/layout are occupying the main thread.

## Separate correctness finding

TASK-010.05.01 tracks a discovered mismatch between the UI lint-state profile
identity (v1) and the current engine/native transfer identity (v2). That can
reject moving tabs with lint state between windows. It is not a performance
optimization and was not silently fixed here. The worker measurements execute
the current renderer-aligned checks despite the stale UI label. The user has
authorized fixing that bug after TASK-008.

## Review checklist

1. Open `runs/fixtures/mixed-256k.md` and `mixed-1m.md` in the ordinary app using
   **File → Open**. Type near the beginning, middle and end in **View → Split**;
   compare responsiveness with the synthetic measurements; manual review found
   almost no lag, including the 1 MiB document.
2. Toggle **View → Sync Scrolling**, scroll Source and Preview, then choose
   **View → Input**. Compare latency without expecting Input-only to eliminate
   the existing hidden-Preview work.
3. Click **Lint**, then **Cancel Lint** while available. The button is hidden
   after completion, so a fast run may provide no opportunity to cancel.
   Expect an explicit
   canceled/stale result, not a clean result. Repeat without editing to see the
   completed list, initially limited to 200 rows.
4. Open the 5 MiB fixture last if desired. Expect longer stalls and possible lint
   timeout; stop if it becomes unresponsive. Unsaved test edits need not be kept.
5. Review the proposed dispositions above. Approving this benchmark closes the
   measurement task, not the separately scoped optimization work.
