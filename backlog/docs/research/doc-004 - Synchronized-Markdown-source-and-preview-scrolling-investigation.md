---
id: doc-004
title: Synchronized Markdown source and preview scrolling investigation
type: specification
created_date: '2026-08-29 02:56'
tags:
  - research
  - scrolling
  - markdown
  - editor
---
# Scope and current architecture

QuickMark currently uses a native `textarea` for Markdown source and an independently scrolling `.viewer` element for rendered HTML. Both the main editor and Markdown Examples window replace the preview HTML after every edit. The source and preview therefore have different pixel geometries, and preview geometry can change again after rendering when an image loads or the window is resized.

markdown-it 15 exposes zero-based `[startLine, endLine]` maps on block tokens. The current fixtures produce mapped tokens for headings, paragraphs, blockquotes, lists, horizontal rules, fenced code, tables, and image-containing paragraphs. Inline tokens do not provide sufficient page geometry.

# Compared approaches

## Whole-document proportional

Map `scrollTop / (scrollHeight - clientHeight)` directly between panes.

Advantages:

- Smallest implementation and no renderer changes.
- Constant-time updates and trivial reverse mapping.
- Naturally reaches both document endpoints.

Limitations:

- Treats all source and rendered content as uniformly distributed.
- Drifts badly when a compact source construct renders tall (images, tables, wrapped paragraphs) or a tall source construct renders compactly (link definitions, markup delimiters).
- In the prototype's deliberately uneven 100-unit/1000-pixel scenario, known block positions missed by as much as 120 pixels.
- Errors accumulate over the document and are most visible near the middle.

Disposition: acceptable only as a fallback when fewer than two usable anchors can be measured.

## Heading anchors

Instrument headings with source lines and interpolate between their preview offsets.

Advantages:

- Low DOM/renderer overhead and stable semantic landmarks.
- Good for conventionally structured documents with frequent headings.

Limitations:

- Documents without headings fall back to proportional mapping.
- Long sections containing lists, tables, code, or images can still drift substantially.
- Heading density reflects authoring style rather than rendered geometry.

Disposition: insufficient as the main strategy; headings are useful anchors but not a complete anchor set.

## Full source-position instrumentation

Attach source ranges to every renderable token or line and measure every corresponding preview/source position.

Advantages:

- Highest theoretical fidelity.
- Fine-grained mapping inside large blocks when exact character positions exist.

Limitations:

- markdown-it maps block line ranges, not exact inline character positions.
- Instrumenting nested and inline tokens risks changing renderer output, complicates custom fence/code rendering, and increases DOM size.
- Measuring every source line through a textarea mirror is expensive for large documents.
- More coupling to markdown-it token structure and future renderer plugins.

Disposition: excessive for QuickMark's lightweight architecture and still cannot guarantee exact inline mapping without parser extensions.

## Hybrid block anchors with measured geometry

Instrument mapped opening/self-closing block tokens with source-line metadata. Build mapping points from:

- source anchor positions measured in an offscreen mirror matching textarea width, font, padding, wrapping, and tab behavior; and
- the corresponding preview elements' offsets.

Add document start/end points and perform monotonic piecewise-linear interpolation between neighboring anchors. Use whole-document proportional mapping only when measurement cannot provide at least two points.

Advantages:

- Corrects local height divergence at paragraphs, lists, tables, fences, headings, blockquotes, rules, and image paragraphs.
- Keeps instrumentation at block granularity.
- Piecewise interpolation is reversible and can use binary search.
- The prototype exactly reproduces measured anchor positions and adapts when an image changes a later anchor from 700 to 1100 pixels.

Limitations:

- Requires a textarea measurement mirror because logical source lines do not have uniform pixel height when wrapping.
- Requires renderer instrumentation and geometry invalidation.
- Interpolation within a single very tall block remains approximate.

Disposition: recommended.

# Scenario evaluation

| Scenario | Proportional | Heading anchors | Full instrumentation | Hybrid block anchors |
| --- | --- | --- | --- | --- |
| Large documents | Fast but cumulative drift | Depends on heading density | Highest measure/DOM cost | Sparse anchors plus binary search scale well |
| Headings | Usually acceptable | Exact landmarks | Exact | Exact block landmarks |
| Nested lists | Height divergence | Drifts within sections | Fine-grained but complex nesting | List and nested mapped blocks constrain drift |
| Tables | Often large divergence | Drifts within sections | Accurate with many cells | Table block boundaries constrain drift |
| Fenced code | Source/render line heights differ | Drifts within sections | Accurate but custom renderer coupling | Fence boundary anchors; interpolation inside |
| Images | Wrong until/after load | Later headings move | Must remeasure | Resize observation invalidates/rebuilds anchors |
| Wrapped source lines | Logical line ratio is wrong | Same source-side problem | Exact mirror is costly at every line | Mirror measures only block anchor lines |
| Very different pane heights | Large middle errors | Locally reduced | Best | Locally reduced with endpoint guarantees |
| Documents without mapped blocks | Endpoint-only | Endpoint-only | Parser-specific fallback needed | Proportional fallback |

The repository prototype covers current mixed fixtures, headings, blockquotes, nested lists, tables, fences, image paragraphs, uneven height mappings, post-image geometry changes, duplicate/non-monotonic measurements, and endpoint/interpolation behavior.

# Recommended interaction model

- Add an explicit **Sync Scrolling** check item to View and a matching compact toolbar control only if usability review justifies duplication.
- Default it off for existing users; persist it with view preferences.
- Enable synchronization only while Split view is visible. Preserve the preference when switching to a single-pane view.
- The pane receiving the latest trusted user scroll owns direction. Do not continuously make both scroll handlers fight for ownership.
- Coalesce user scroll work into one `requestAnimationFrame` callback.
- Mark programmatic scroll updates and ignore the resulting counterpart event until the scheduled frame completes. Do not rely on exact `scrollTop` equality.
- During typing, source owns the logical position. Before rerendering, capture the source anchor/interpolation coordinate; after rendering and measuring, restore the preview position from that coordinate.
- Composition/input changes must not force the source pane itself to jump.
- Pointer, wheel, touch, keyboard, and scrollbar scrolling all establish ownership through trusted scroll/input signals.
- Switching pane order does not change ownership semantics.

# Measurement and invalidation

1. Extend the shared renderer with optional block-source instrumentation so normal rendering output remains unchanged when synchronization is disabled.
2. Rebuild source/preview mapping after a render, after either pane's width changes, and after preview content height changes.
3. Use `ResizeObserver` on the panes/preview content to catch window resizing and image-driven height changes. Image load/error listeners may schedule the same invalidation path where needed.
4. Debounce full measurement rebuilds; do not measure geometry on every scroll event.
5. Cache mappings until content or layout invalidates them.
6. Normalize duplicate/non-monotonic points and always add start/end points.
7. Use binary search and piecewise interpolation during scroll, making each update `O(log n)` in the number of anchors.

# Performance and maintenance implications

- Parsing already occurs on each render; collecting block token maps during that pass avoids a second Markdown parse in production.
- The source mirror is the main new layout cost. It should contain escaped text plus markers only at mapped block starts, remain outside the accessibility tree, and rebuild only after content/width/font changes.
- Preview `offsetTop` reads should be batched after DOM writes to avoid layout thrashing.
- A long document with hundreds of blocks remains practical if measurement is debounced and scrolling only interpolates cached points.
- Renderer instrumentation must preserve the existing HTML escaping, safe links, custom code wrappers, copy buttons, print CSS, and reusable browser-neutral renderer contract.
- Main and Examples should share one controller; README is preview-only and must not expose the option.
- Tests should treat source-line attributes as internal metadata and assert that disabling instrumentation reproduces current HTML exactly.

# Bounded follow-up implementation scope

A future implementation task should be independently complete when it:

1. Adds optional block source-line attributes through the shared renderer without changing ordinary rendered HTML or safety behavior.
2. Implements and unit-tests monotonic mapping, piecewise interpolation, endpoint handling, proportional fallback, and reverse mapping.
3. Implements a source mirror that matches textarea wrapping and verifies anchor offsets for short, long, blank, tabbed, and wrapped lines.
4. Adds a reusable synchronization controller with explicit enablement, latest-user-pane ownership, animation-frame coalescing, programmatic-event suppression, rerender preservation, and clean teardown.
5. Integrates the controller and persisted menu/toolbar state into the main editor and Markdown Examples only in Split view.
6. Handles resize and delayed image layout changes without jumps or feedback loops.
7. Verifies large mixed documents and both scroll directions through DOM tests plus native manual testing.
8. Documents the user control and known limitation that interpolation inside one unusually tall block is approximate.

Do not combine this work with unrelated editor features or TASK-003.
