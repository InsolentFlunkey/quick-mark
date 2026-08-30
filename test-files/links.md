# Links

## External — should open in the system browser

- [Anthropic](https://www.anthropic.com)
- [Example](https://example.com)
- Autolinked: https://example.org/path?query=1

Click either link and confirm that the system browser opens without replacing the QuickMark editor window.

## In-page anchors — should stay in this tab

- [Jump to bottom](#bottom)
- [Back to top](#links)

## Relative — should stay in this tab

- [Kitchen sink](./kitchen-sink.md)
- [Test files index](./README.md)

## Mailto — should open in the system mail application

- [Email someone](mailto:nobody@example.com)

## Disallowed schemes — should render as plain text, not a link

- [javascript URL](javascript:alert('xss'))
- [data URL](data:text/html,<script>alert(1)</script>)

---

<a id="bottom"></a>

Bottom of the document.
