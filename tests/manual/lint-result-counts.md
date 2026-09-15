# Lint result counts (TASK-010.02.01)

Use the rebuilt `src-tauri/target/debug/quick-mark.exe`.

1. Open `research/performance/runs/fixtures/mixed-1m.md` and click **Lint**.
   With default rules, expect **1–200 of 2840 issues found** and a prominent
   blue **Load more** button. The total may differ with configured rules.
2. Tab to **Load more**. Expect a clear focus outline. Press Enter; expect
   **1–400 of 2840**, with focus still on the button. Repeat to the final batch;
   expect **1–2840 of 2840**, no Load more button, and focus on the issue list.
3. Click **Run Again**. Expect the first 200 issues and highlighted button again.
   Edit Source: expect **out of date** alongside the loaded count. Loading more
   old results must not enable their source-navigation buttons.
4. Lint a new document containing `# Title`, a blank line, and `A paragraph.`,
   with a trailing newline. Expect **No issues found** and no Load more button.

Generated performance fixtures are optional local test inputs. Automated tests
cover zero/single/small/exact/partial batches and navigation-driven expansion.
