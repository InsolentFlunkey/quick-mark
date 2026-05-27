# Print test

Use this file to verify the print fix.

## Steps

1. Load this file into QuickMark.
2. Set the **View** dropdown to **Input Pane** (preview hidden).
3. Press **Ctrl+P** (or click the **Print** button).
4. The print preview should show *this rendered content* — headings, lists, the code block below — not a blank page.
5. After closing the print dialog, the View dropdown should still read **Input Pane**, and the preview pane should be hidden again.

## Sample content to verify in print preview

> A blockquote should render with its left border in print, and the text should be black on white (not the dark-mode colors).

```js
// Code blocks should print with a light background and a visible border.
function add(a, b) {
  return a + b;
}
```

- A bulleted list
- with a couple of items
- to occupy some vertical space

The Print button, toolbar, and per-block Copy buttons should be hidden in the printed output.
