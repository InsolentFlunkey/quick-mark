# Heading fragment verification

Open this file using **File → Open**. Choose **View → Split**. The links below
include deliberate missing targets for testing MD051.

[Go to first destination](#destination)

[Go to second destination](#destination-1)

[Go to Unicode heading](#caf%C3%A9-%E4%B8%AD%E6%96%87)

[Missing destination](#missing)

[Unsupported explicit ID](#custom)

[Unsupported HTML ID](#raw)

[Unsupported line fragment](#L20)

[Unsupported top alias](#top)

## Spacer one

This section provides scrolling space. Resize the window shorter if all headings
are visible together.

1. First line of filler.
2. Second line of filler.
3. Third line of filler.
4. Fourth line of filler.
5. Fifth line of filler.
6. Sixth line of filler.
7. Seventh line of filler.
8. Eighth line of filler.

## Destination

This is the **first destination**. [Return to the top](#).

## Spacer two

1. More filler.
2. More filler.
3. More filler.
4. More filler.
5. More filler.
6. More filler.
7. More filler.
8. More filler.

## Destination

This is the **second destination**, with anchor `destination-1`.
[Return to the top](#).

## Café 中文

The encoded link goes here. [Return to the top](#).

## Explicit {#custom}

The automatic anchor is `explicit-custom`; the attribute is literal text.

<a id="raw"></a>

## Manual checks

1. Click each **Go to...** link above. Expect the named heading in Preview;
   with **Sync Scrolling** enabled, Source follows without changing the caret.
   Disable **Sync Scrolling**, repeat, and expect only Preview to scroll.
2. Tab to **Go to second destination** in Preview and press Enter. Expect the
   second heading. Click **Return to the top** and expect Preview's beginning.
3. Click **Missing destination** and each **Unsupported...** link. Expect an
   in-document-target error; the app and active document stay open.
4. Click **Lint**. Expect five MD051 findings for the deliberate missing targets;
   duplicate-heading warnings and MD042 advice for working `#` links also appear. Click an
   MD051 finding to jump to its source block. Choose **Preview** to use the links.
5. Rename the second `Destination` heading to `Renamed`. Click **Run Again**.
   Expect an additional MD051 finding for `#destination-1`. Change that link to
   `#renamed` and run again; the additional finding disappears.
6. In **Settings → Markdown Lint Rules**, expand **Links, images and HTML →
   Individual rules** and turn off **MD051**. Run lint again: fragment findings
   disappear. Use **Restore QuickMark Defaults**, then run again: they return.
   An MD051 choice survives restarting the app; unsaved content does not, so save
   a copy before restarting if you want to keep edits.
7. Open another document with a `Destination` heading. Switch back to this tab
   and use its links; they must target this document. Use **Move Tab to New
   Window** and repeat. Completed lint results should transfer with the tab.
8. Open **Help → Markdown Examples** and click **Jump to Code**, then **return
   to the top**. Both work within that reference preview.
