# Code blocks

Each fenced block should render with a **Copy** button in the top-right corner. Clicking it should copy the *raw* text (no leading indentation, no language hint) and show a "Copied" toast.

## JavaScript

```js
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("world"));
```

## Python

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(10))
```

## PowerShell

```powershell
Get-ChildItem -Recurse -Filter *.md |
  Where-Object { $_.Length -gt 1kb } |
  Select-Object Name, Length
```

## No language hint

```
plain text block
  with   weird   spacing
    preserved
```

## HTML inside a code block (must be escaped, not executed)

```html
<script>alert("you should see this as text, not a popup")</script>
<img src="x" onerror="alert('nope')">
```

## Indented code block (4-space form)

    # This is an indented code block.
    # It should also get a Copy button.
    echo "hello"
