# XSS / injection probes

Nothing on this page should pop an alert, execute a script, or load a remote image. All raw HTML should appear as escaped text in the preview.

## Raw HTML (markdown-it is configured with `html: false`)

<script>alert("xss-1")</script>

<img src="x" onerror="alert('xss-2')">

<iframe src="https://example.com"></iframe>

<a href="javascript:alert('xss-3')">click me</a>

## Disallowed link schemes

[javascript link](javascript:alert('xss-4'))

[data URL](data:text/html,<script>alert('xss-5')</script>)

[vbscript](vbscript:msgbox("xss-6"))

## HTML inside fenced code (should escape, not execute)

```html
<script>alert("xss-7")</script>
```

## Inline code with HTML-ish content

Try this: `<img src=x onerror=alert(1)>`

## Curly quotes / typography (sanity)

"Hello" -- it's a test... and an ellipsis.
