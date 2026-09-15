# Native performance measurements

Generated from research/performance/baseline/native-single-edit-native.jsonl and its memory trace. Units: milliseconds unless noted.
Measured 2026-09-14T02:03:34.338Z on 13th Gen Intel(R) Core(TM) i7-13620H, 16 logical processors;
Microsoft Windows 11 Pro 10.0.26200, 63.7 GiB usable RAM.
standalone-debug-benchmark; viewport 1100×700, scale 1.5, visibility visible.
Runtime: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0.

## Render and layout components

First frame is an integrated single observation. Component medians use five samples after warm-up for normal sizes,
one sample after warm-up for stress sizes. Lint includes worker startup and is one native observation.

| Fixture | DOM nodes | First frame | Parse | DOM replacement | Forced layout | Mapping | Lint |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| mixed-256k | 10680 | 254.2 | 23.5 | 25.1 | 85.1 | 53.4 | 326.8 |
| mixed-1m | 42570 | 832.4 | 77.1 | 86.4 | 350.2 | 198.1 | 1165.3 |
| mixed-5m | 212370 | 4093.7 | 423.9 | 465.6 | 2304.3 | 1487.3 | Error: Linting timed out after 10 seconds. |
| lines-50k | 1 | 770.5 | 46.9 | 0.9 | 41.7 | 68.8 | Error: Linting timed out after 10 seconds. |
| wrapped-200k | 1 | 41.5 | 1.1 | 0.3 | 20.1 | 15.0 | 147.0 |
| dense-table | 40007 | 570.7 | 69.4 | 49.0 | 111.5 | 90.8 | 6056.2 |

## Repeated editing

Fifteen samples per row: five each near the start, middle and end after warm-ups.
Two-rAF measurements approximate paint opportunity, not physical input-to-photon latency.

| Fixture | View | Sync | Handler median | Frame median | Frame max |
| --- | --- | --- | ---: | ---: | ---: |
| mixed-256k | input | false | 41.8 | 91.1 | 112.3 |
| mixed-256k | input | true | 42.0 | 85.2 | 124.6 |
| mixed-256k | both | false | 51.3 | 205.2 | 226.7 |
| mixed-256k | both | true | 46.1 | 249.6 | 343.6 |
| mixed-1m | input | false | 166.7 | 365.4 | 490.1 |
| mixed-1m | input | true | 167.1 | 362.7 | 394.1 |
| mixed-1m | both | false | 211.6 | 869.3 | 1069.6 |
| mixed-1m | both | true | 185.9 | 1059.4 | 1215.0 |

## Memory

Process-tree sums, MiB. Shared working-set pages may be counted more than once.
Sequential workloads retain allocations; after-close measurements are not leak proof or per-document budgets.

| Stage | Working set | Private bytes | Samples in window |
| --- | ---: | ---: | ---: |
| idle-memory | 395.9 | 206.8 | 2 |
| three-documents-memory | 2696.6 | 2529.6 | 5 |
| post-close-memory | 2574.5 | 2401.0 | 2 |
| Entire-run sampled peak | 5670.5 | 5541.0 | 120 |

Proposed **review alerts**, not supported-file limits: investigate increases beyond
the observed per-case private-byte peak plus the greater of 25% or 128 MiB, using
the same ordered workload and fresh launch. The tolerance allows allocator and
sampling variability. It does not bless current high memory use as desirable.

| Fixture interval | Observed peak private MiB | Proposed alert MiB |
| --- | ---: | ---: |
| mixed-256k | 1068.5 | 1335.6 |
| mixed-1m | 2725.4 | 3406.7 |
| mixed-5m | 5541.0 | 6926.3 |
| lines-50k | 3552.0 | 4440.0 |
| wrapped-200k | 2709.6 | 3387.0 |
| dense-table | 2567.1 | 3208.8 |

## Lint results and cancellation

| Fixture | UI completion | Initial rows | Status |
| --- | ---: | ---: | --- |
| mixed-256k | 450.4 | 200 | Untitled.md: 715 issues found. Profile: quickmark-1-markdownlint-0.41.1 |
| mixed-1m | 1541.3 | 200 | Untitled.md: 2841 issues found. Profile: quickmark-1-markdownlint-0.41.1 |
| dense-table | 7079.7 | 200 | Untitled.md: 10001 issues found. Profile: quickmark-1-markdownlint-0.41.1 |

| Fixture | Cancel available | Click-to-frame |
| --- | --- | ---: |
| mixed-256k | true | 15.9 |
| mixed-1m | true | 24.2 |
| dense-table | true | 9.8 |

Tab-switch median: 779.6 ms.
Tab switch during lint: 902.7 ms.
Total native long tasks: 297; maximum 4681.0 ms.
These include deliberately synchronous component probes, not just editing.
