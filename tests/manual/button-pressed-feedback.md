# Button pressed feedback (TASK-027)

Use the rebuilt `src-tauri/target/debug/quick-mark.exe`. The user approved the
native review on 2026-09-14; automated DOM tests cannot verify CSS `:active`.

1. Press and hold **Swap** with the left mouse button. Expect a contrasting
   inset border without movement of the button or neighboring controls. Release:
   expect one pane swap and removal of the inset border. Press again, drag outside
   the button and release: expect no swap and no stuck pressed appearance.
2. Tab to **Swap**. Expect the keyboard focus outline. Hold Space: expect the
   inset border in addition to focus; release: expect one swap. Press Enter:
   expect immediate native activation and no stuck pressed appearance (Enter
   need not remain visually pressed while held). Tab away: expect focus to move.
3. Click **Table Builder**, then hold **Cancel** before releasing. Expect the same
   inset feedback, then the dialog closes. Reopen and use Tab/Shift+Tab to reach
   **Cancel**, then Space; expect visible focus and normal dismissal. Repeat with
   **New**, the document tab title, and its **Close** button using disposable tabs.
   The active tab's blue bottom marker must persist after the press ends; arrow
   keys must still switch tabs. No control or surrounding content should move.
4. Open `research/performance/runs/fixtures/mixed-1m.md` and click **Lint**.
   Hold **Load more**: expect its approved dark inset border on the blue fill.
   Hover: expect the contrasting border and no underline. Tab to **Load more**:
   expect the bright focus outline. Space/Enter must load one batch normally;
   after the final batch the button disappears and focus moves to the issue list.
5. Hold **Previous Issue**, **Next Issue**, **Lint Results**, **Preview**, and an issue's
   **Line …** button in turn. Expect consistent inset feedback while pressed.
   After release, the current issue outline must remain distinct from the
   temporary inset, and navigation/pane switching must work as before. Switching
   panes must not leave a button looking physically held down.
6. Edit the source after linting to make the results stale. Hold a disabled issue
   **Line …** button and try **Previous Issue**/**Next Issue**: expect no inset feedback and
   no navigation. **Run Again** must still work and restore usable issue buttons.
7. Open **Help → Markdown Cheat Sheet** and press a **Copy** control, then open
   **Help → README**, follow a guide link and press **Back**. Expect the same
   temporary feedback and normal copy/navigation behavior. Native system menus
   and file dialogs deliberately retain Windows-provided pressed feedback.

The change adds no hover underline and no stored state. Restarting the app must
not restore a momentary press; save any document edits before restarting.
