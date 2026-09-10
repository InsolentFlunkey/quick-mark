# Manual lint-rule test guide

Open `lint-rule-sample.md` in QuickMark with the **Open** toolbar button.
This sample intentionally contains violations. It exercises every settings
group, not every individual rule in the lint engine.

Use this guide beside the app; run lint on the sample, not on this guide.
Line numbers below apply to the unchanged sample. Settings changes affect the
whole application, so restore your preferred choices after testing.

## Default findings

1. Open **Edit → Settings → Markdown Lint Rules**.
2. Click **Restore QuickMark Defaults**, then **Close**.
3. Click the **Lint** toolbar button with the sample's document tab active.

Expect **13 issues** with these rule IDs and source lines:

| Settings group | Rule | Line | Deliberate problem |
| --- | --- | --- | --- |
| Headings | MD025 | 9 | A second H1 document title |
| Headings | MD001 | 11 | Jump from H1 to H3 |
| Lists | MD004 | 18, 19 | Hyphen bullets after asterisk bullets |
| Spacing and blockquotes | MD013 | 23 | Line longer than 80 characters |
| Spacing and blockquotes | MD028 | 26 | Blank line between blockquotes |
| Code blocks and inline code | MD040 | 31 | Fence without a language |
| Links, images and HTML | MD042 | 37 | Empty link destination |
| Links, images and HTML | MD033 | 43 | Raw HTML |
| Emphasis and names | MD049 | 49 | Underscores after asterisk emphasis |
| Tables and thematic breaks | MD056 | 55 | Too many table cells |
| Tables and thematic breaks | MD035 | 59 | Inconsistent break style |

MD049 reports two findings on line 49, one for each emphasis delimiter.
Both are expected. The missing section link on line 41 has no MD051 finding:
that check is deliberately unavailable until heading anchors are supported.
Do not use the absence of a finding as evidence that the link works.

## Individual switches and stale results

1. In Settings, expand **Headings → Individual rules**.
2. Uncheck **MD025**. The **Headings** group checkbox should become mixed.
3. Close Settings. The old results should say **out of date**, and their source
   navigation buttons should be disabled. No new check starts automatically.
4. Click **Run Again**. Expect **12 issues**, with MD025 absent and MD001 present.
5. Re-enable **MD025** and click **Run Again**. Expect the original 13 issues.

## Group switches

Start each row below by clicking **Restore QuickMark Defaults** in Settings.
Uncheck the named group, close Settings and click **Run Again**.

| Group switched off | Expected issue count | Rules that disappear |
| --- | --- | --- |
| Headings | 11 | MD025, MD001 |
| Lists | 11 | MD004 |
| Spacing and blockquotes | 11 | MD013, MD028 |
| Code blocks and inline code | 12 | MD040 |
| Links, images and HTML | 11 | MD042, MD033 |
| Emphasis and names | 11 | MD049 |
| Tables and thematic breaks | 11 | MD056, MD035 |

**Links, images and HTML** starts mixed because MD034 is off by default.
To switch that group off, click its mixed checkbox once to enable all available
members, then click again to disable them. MD051 stays unavailable throughout.

For another mixed-state check, disable MD025 individually, then click the mixed
**Headings** checkbox. Every available heading rule should turn on. Switching
the group off and back on enables all members; it does not restore the earlier
individual MD025 exclusion.

## Optional rule and defaults

1. Restore defaults. Expand **Links, images and HTML → Individual rules**.
2. Enable **MD034**, close Settings and click **Run Again**.
3. Expect **14 issues**, including MD034 at line 39 for the bare URL.
4. Confirm **MD051** cannot be enabled and has an explanatory note.
5. Click **Restore QuickMark Defaults**. MD034 turns off; MD051 stays unavailable.
   The next run returns to 13 issues.

## Save decisions, windows and restart

1. Enable **Settings → General → Lint before saving**.
2. With default rules, use **Save As** on the sample and choose **Review Issues**.
   Expect the 13 findings and no filename dialog or write.
3. In Settings, turn off every group. For a mixed group, first enable all and
   then turn it off. Close Settings and click **Run Again**.
4. Expect **No issues found**. This means the enabled checks found nothing;
   here all available checks are disabled, and the deliberate problems remain.
5. Use **Save As** again. It should proceed to the filename dialog without an
   issues prompt. Choose a temporary working-copy name to keep the sample intact.
   After the write, expect the five-second clean-save notice.
6. Open a second editor window. Its Settings should show the same rule choices
   once idle. Change a rule there and confirm the first window follows.
7. Close all QuickMark windows and relaunch. The rule choices and
   **Lint before saving** should survive the restart.
8. Click **Restore QuickMark Defaults**. Default rule choices return, while
   **Lint before saving** remains enabled. Restore your preferred settings
   when you finish testing.

## Keyboard check

In Settings, use **Tab** to reach a group checkbox and **Space** to toggle it.
Reach its **Individual rules** disclosure and use **Enter** or **Space** to
expand it, then tab to individual checkboxes. Focus should remain visible.
