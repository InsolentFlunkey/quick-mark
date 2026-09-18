# Markdown linting

[README](../README.md)

Use the **Lint** toolbar button or **Edit → Lint Markdown** to check the active
tab's current text. Saving is not required; untitled and read-only documents can
also be checked. Linting is advisory and does not edit the source.

QuickMark uses markdownlint 0.41.1 with its standard formatting checks. Bare-URL
warnings (MD034) are off by default because QuickMark linkifies bare URLs; you
can enable that style advice. Heading-fragment validation (MD051) is on by
default and uses QuickMark's renderer to check the
[section-link contract](markdown.md). This is QuickMark-specific
validation under the MD051 setting, not the upstream GitHub fragment algorithm.
It accepts rendered heading anchors and `#` for the preview top, and reports
missing destinations in inline and reference-style section links. Explicit
heading attributes, HTML anchors and GitHub line fragments do not create targets.
It does not validate external URLs, file-qualified links, image URLs or code
examples as section links. Fragment findings name the destination and navigate
to the start of its containing source block; exact inline ranges are unavailable.
The separate MD042 rule still flags bare `#` links as empty-link style advice,
even though they work for top navigation and pass MD051. Other rules can also
report formatting advice for supported section links.
The profile checks formatting as well as likely syntax problems; a clean result
does not guarantee that optional syntax is supported by QuickMark's renderer.
Project configuration files and inline lint-disable comments do not change this
profile.

Use **Settings → Markdown Lint Rules** to change individual rules or whole groups:
Headings; Lists; Spacing and blockquotes; Code blocks and inline code; Links,
images and HTML; Emphasis and names; Tables and thematic breaks. Expand
**Individual rules** within a group to see each rule's ID and description.
Each rule belongs to one group. A mixed group checkbox means only some available
members are enabled. Clicking it enables all available members; turning a group
off and back on enables every member instead of restoring earlier individual
choices. MD051 participates in the **Links, images and HTML** group.

Changes save automatically, persist across restarts, and synchronize across
editor windows when they are idle. A failed preference write displays an error
and keeps the last accepted choices. **Restore QuickMark Defaults** resets only
rule choices; it leaves **Lint before saving** and other Settings unchanged.
MD043 (required headings) and MD044 (proper names) currently impose no extra
constraints because no heading outline or spelling list is configured. These
controls enable/disable rules; they do not edit rule options such as line length.

Manual, real-time, and before-save checks use the same choices. Changing rules
marks old results **out of date** and disables their source navigation. With
real-time linting off, it does not run a new check automatically; choose
**Run Again** to check with the latest choices. With real-time linting on, the
active document is scheduled for a background refresh.
An ongoing save, including **Retry**, retains the choices captured at its start;
subsequent saves use the latest choices. Its cached results are still marked
out of date if the shared choices change.

## Lint while typing

Enable **Settings → General → Lint while typing** to refresh lint findings after
you pause editing. This setting is independent of **Lint before saving**, defaults
off, persists across restarts, and synchronizes across editor windows. QuickMark
waits 750 milliseconds after the most recent edit and keeps only one pending or
running background check, so a burst of keystrokes does not start a check for
each intermediate document state. A newer edit cancels and supersedes older work;
results are accepted only for the exact document revision and rule choices that
were checked.

Background linting leaves Preview visible, does not move keyboard focus, and
never opens a save decision. The toolbar reports current results compactly as
**Lint (3)** or **Lint (0)**. A nonzero count uses the current theme's warning
colors so findings are noticeable without opening the results pane. The count disappears as soon as another edit makes
it outdated. **Lint (!)** means that the current background check failed or
timed out. Activate the Lint control to open the existing detailed results pane;
when its cached results are current, QuickMark opens them without running the
same check again. If the results pane is already open, it updates in place after
the debounce. Manual checks and lint-before-save decisions take precedence over
background work and retain their existing behavior.

When a nonempty document is opened while **Lint while typing** is enabled,
QuickMark schedules its first check after the same idle delay. Empty new
documents are skipped. Background or restored tabs wait until first activation,
and a current cached result is reused instead of being checked again.

Inline editor underlines and issue tooltips are not part of this mode. TASK-031
tracks the CodeMirror investigation for that enhanced presentation.

Lint opens Source beside **Lint Results**. Each issue identifies its line,
column when available, rule, message and source context. Activate an issue to
select its source location, or use **Previous Issue** and **Next Issue**. From
Source, **Alt+Escape** returns focus to the Lint Results control. Use **Preview**
to inspect the rendering, **Lint Results** to return to the list, and **Return
to Previous View** to restore the layout used before linting. Explicitly choosing
a normal View also exits inspection. Navigation changes the caret, not the text.

With **Sync Scrolling** enabled, Source follows scrolling in the issue list and
the list follows the nearest issue when Source is scrolled. This does not move
the caret. Empty or outdated results do not drive synchronization. After editing
or reloading, results are marked **out of date** and source jumps are disabled;
choose **Run Again** to refresh them.

Results remain with their tab, including completed results when moving it to a
new window. Out-of-date results also move with the tab and remain out of date
until **Run Again** completes. Running checks are canceled when moving the tab. Results are not
restored after restarting the application. Large result sets initially show 200
issues; the summary shows the displayed range and total, such as **1–200 of
2840 issues found**. The highlighted **Load more** button reveals the next batch
and updates the range. It disappears when all issues are displayed, moving
keyboard focus to the issue list. A fresh run starts with the first batch again.
**Cancel Lint** stops a running
check. Checks that exceed ten seconds report a timeout; you can retry, and the
document remains editable. Errors are displayed separately from clean results.

Enable **Settings → General → Lint before saving** to check the pending content
before **Save** or **Save As** writes it, including recovery copies and Save
chosen during Close or Clear. The setting defaults off, is shared across editor
windows, and survives restarts. A toggle affects saves that begin afterward.
Persistence errors appear in Settings; the checkbox keeps its last saved value.

QuickMark checks your current text immediately, before asking for a filename or
location and before checking the document on disk. A clean check proceeds to the
normal save flow, including a destination chooser when needed. Only a successful
write shows **Save complete, no linter issues found** with the filename for five
seconds; **Dismiss** closes it sooner. Canceling a later file dialog never shows
Save complete.

If issues are found, the document has **not** been saved. Choose **Review Issues**
to stop before any file dialogs and open the originating tab's results,
**Save Anyway** to continue to the normal file dialogs and save the checked
content, or **Cancel** to keep editing without saving. The prompt
initially focuses **Cancel**. Escape, clicking outside it, or attempting to close
the window will not resolve the choice. Save Anyway never overrides filesystem
errors or external-change protection and never claims that the lint check was
clean.

While the check or decision is pending, Close, Clear, and Move Tab to New Window
wait. You can select another tab while the worker runs. **Review Issues** and
**Cancel** also stop a pending Close/Clear action; **Save Anyway**, or a clean
check followed by a successful write, allows it to continue. Close Window checks
documents in order and stops at Review or Cancel, preserving earlier saves.

**Cancel Lint**, a timeout, or a worker error produces a separate notice saying
the document has not been saved. **Retry** checks the same pending content again;
**Save Anyway** writes without a successful lint check; **Cancel** stops the save.
A failed write never shows Save complete. A Recent Files update error after a
successful write is reported separately; it does not undo the save.

Developers can verify the production worker after a build with
`node scripts/check-lint-worker.mjs`; add `--benchmark` for large-input probes.
These Node worker measurements complement native WebKitGTK verification.
