# Lists and indent behavior

This file is mostly an editor-behavior fixture. Load it, then try these things in the **input pane**:

## Auto-continue

1. Click at the end of the line `- second` below.
2. Press **Enter** — a new `- ` should appear automatically.
3. Press **Enter** again on the now-empty bullet — the bullet should disappear and you should drop to a plain blank line.

- first
- second
- third

Same for ordered lists:

1. one
2. two
3. three

## Tab / Shift+Tab

1. Select the three bullets below.
2. Press **Tab** — all three should indent by four spaces.
3. Press **Shift+Tab** — they should outdent.

- alpha
- beta
- gamma

## Indent inside a list item

Place the cursor right after the `- ` in this bullet and press **Tab**. The bullet itself should indent (not insert literal spaces in the middle of the marker):

- indent me
