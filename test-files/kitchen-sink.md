# Kitchen sink

A broad smoke test for the renderer.

## Paragraphs and emphasis

Lorem ipsum **bold** and *italic* and ***both*** and `inline code` and ~~strike~~.

A second paragraph with a [relative link](./links.md) and an autolinked URL: https://example.com.

## Headings

### Level 3
#### Level 4
##### Level 5
###### Level 6

## Blockquote

> "The best way to predict the future is to invent it." — Alan Kay
>
> Nested quotes:
>
> > Second level.

## Lists

Unordered:

- apples
- oranges
  - mandarins
  - blood oranges
- pears

Ordered:

1. First
2. Second
3. Third

## Horizontal rule

---

## Inline code and a fenced block

Use `Array.prototype.map` for transformations.

```js
const doubled = [1, 2, 3].map((n) => n * 2);
console.log(doubled);
```

## Table

| Col A | Col B |
| ----- | ----- |
| 1     | 2     |
| 3     | 4     |

## Task-list markers (unsupported — render as literal text in a plain list)

- [ ] todo
- [x] done
