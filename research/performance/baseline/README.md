# Baseline provenance

Collected on 2026-09-13 evening / 2026-09-14 UTC for TASK-008, against application
commit `35ed432` with this task's opt-in diagnostic instrumentation. The normal
app's runtime algorithms were not optimized. Node and native measurements ran
sequentially, without simultaneous builds/tests.

- `native-single-edit-native.jsonl`: final actual Windows WebView2 run, with
  single-character range replacements for repeated editing.
- `native-single-edit-memory.jsonl`: paired Windows process-tree memory samples
  and hardware/OS metadata.
- `measurements.md`: generated native tables and proposed memory review alerts.
- `node.jsonl`: Node component/production-worker samples, including failures.

Regenerate the native tables from the repository root:

```powershell
node research/performance/summarize.mjs research/performance/baseline/native-single-edit research/performance/baseline/measurements.md
```

The native viewport was **1100×700 CSS pixels at 150% DPI**. Match the logged
viewport when comparing future runs; do not assume the saved window geometry
equals the configured initial size. Raw timestamps align memory with stages.
Node's RSS is its process snapshot, not native memory or a per-document budget.

Calibration runs remain uncommitted in ignored `runs/`: the first run measured
lint cancellation instead of completed rows; the next confirmed row/cancel
probes but still used full-buffer replacements for editing. Neither is used in
the final repeated-edit table. The final native run and all calibration runs
completed, without the external watchdog killing a process.

The uninterrupted lint UI probe uses the source after appending one newline;
it can have one additional formatting finding compared with the direct worker
probe. The stale profile label visible in raw UI records is separately tracked
by TASK-010.05.01; the worker uses the current renderer-aligned profile.

See [findings and proposed dispositions](../findings.md) and the
[full methodology](../README.md). No Linux native claims or physical keyboard
latency claims are made by these Windows synthetic-input measurements.
