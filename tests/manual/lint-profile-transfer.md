# Lint profile transfer (TASK-010.05.01)

Use the freshly built `src-tauri/target/debug/quick-mark.exe`.

1. In a new document, enter `# Title`, a blank line, then `[text]()`.
   Click **Lint**. Expect an empty-link finding and profile
   `quickmark-2-markdownlint-0.41.1` in the results summary.
2. Choose **File → Move Tab to New Window**. Expect the document and completed
   results in the new window, with no transfer error. Click the empty-link
   finding; expect its source location to be selected.
3. Edit the source. Expect results to become **out of date**. Choose
   **File → Move Tab to New Window** again. Expect the edited text and outdated
   results to move; issue navigation remains disabled until rerun.
4. Click **Run Again** in the destination. Expect current results with the same
   v2 profile and working issue navigation. Results are session-only and are
   deliberately not restored after restarting the application.

Automated tests cover incompatible v1 rejection; do not manually alter user data
to manufacture an incompatible transfer.
