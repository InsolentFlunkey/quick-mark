# QuickMark lint rule sample

This document deliberately contains lint findings for manual testing.
See lint-rule-guide.md in this directory for the expected results and steps.
Use a working copy if you want to edit or save it while testing.

## Headings

# Another document title

### Skipped heading level

## Lists

* First bullet uses an asterisk.
* Second bullet uses an asterisk.

- This list switches to hyphen bullets.
- Another hyphen bullet.

## Spacing and blockquotes

This deliberately long paragraph exceeds the default eighty-character line limit so that the spacing group has an easy warning to switch off and restore.

> A first blockquote.

> A second blockquote separated by a blank line.

## Code blocks and inline code

```
const languageWasNotSpecified = true;
```

## Links, images and HTML

[An empty destination]()

https://example.com

[A missing section](#there-is-no-such-heading)

<div>This HTML is displayed literally by QuickMark.</div>

## Emphasis and names

*This uses asterisks for emphasis.*

_This switches to underscores for emphasis._

## Tables and thematic breaks

| Item | Description |
| --- | --- |
| One | Two | An extra cell |

---

***
