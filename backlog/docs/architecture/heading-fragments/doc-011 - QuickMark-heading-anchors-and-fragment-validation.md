---
id: doc-011
title: QuickMark heading anchors and fragment validation
type: specification
created_date: '2026-09-14 01:08'
updated_date: '2026-09-15 00:53'
tags:
  - markdown
  - linting
  - task-010.05
  - approved
---
# Heading anchors and fragment validation

Approved contract for TASK-010.05, reviewed by the user on 2026-09-13.

## Naming

The shared markdown-it renderer parses headings and section links for both Preview and linting. Heading text includes text/code tokens, link labels and recursively extracted image alt text, with formatting markers and destinations omitted. Use the existing HTML-disabled, linkify/typographer-enabled dialect. Normalize to NFC, lowercase, retain Unicode letters/marks/numbers, underscores and hyphens, remove other punctuation/symbols, trim whitespace and replace whitespace runs with hyphens. Use `section` for an empty result. Allocate names in document order with numeric suffixes until unique against all assigned IDs. A per-base suffix counter avoids quadratic duplicate allocation. Allocation resets per parse. Example: Name, Name, Name-1, Name => name, name-1, name-1-1, name-2.

## Destinations and isolation

Decode fragment-only destinations once with decodeURIComponent and compare case-sensitively. Malformed encodings and missing targets are errors. `#` scrolls to the current preview top. `#top` has no reserved meaning; it requires a heading generating `top`. Explicit `{#id}` remains literal heading text, raw HTML id/name attributes create no elements, and GitHub line/content fragments have no special meaning. File-qualified fragments are outside this feature; existing native resource restrictions continue to apply.

Rendered headings carry id and data-heading-anchor attributes. The resource controller searches only marked headings beneath its own preview, never document-wide IDs or application controls, and changes only that preview's scrollTop. Existing scroll events drive source synchronization when enabled; source selection is unchanged. No location hash navigation, global scrollIntoView, network lookup or cross-document target discovery is introduced. Source-map attributes remain intact.

## Lint integration

MD051 is now available and enabled by default in Links, images and HTML, with ordinary individual/group overrides. Internally upstream MD051 is disabled: QuickMark uses shared renderer analysis and merges its own MD051 findings into the existing sorted results. Upstream accepts explicit IDs, HTML anchors and GitHub fragments that do not match QuickMark's renderer. This is intentionally documented as QuickMark-specific behavior, not GitHub algorithm conformance.

Only rendered fragment links are checked, including reference links. Code examples, image destinations and external/file-qualified URLs are excluded. markdown-it supplies block source maps, not exact inline ranges: findings point to the containing source block and name the failed destination without fabricating a column. Other enabled rules may still issue formatting advice for supported syntax.

Profile identity is quickmark-2-markdownlint-0.41.1 in frontend and native transfer validation. Old profile results cannot be adopted as current. Native settings validation accepts MD051; missing overrides receive the new default. Preferences persist; lint results remain session-only.

## Verification

Tests cover Unicode/encoding, duplicates and suffix collisions, formatting and image alt text, Setext headings, explicit/HTML/code boundaries, renamed/missing/reference links, isolated preview navigation, synchronization on/off, Settings controls and native persistence/profile rejection. The production worker smoke test executes the built artifact without DOM globals. tests/manual/heading-fragments.md supplies native Windows interaction steps. The user completed the standalone Windows native interaction checklist successfully and authorized commit/push; evidence is recorded in TASK-010.05.

## Final integration details

Cheat Sheet rendered-result regions carry data-markdown-document boundaries. Their links and top navigation stay within their own example; the outer guide cannot target example headings. All scrolling still occurs in the enclosing preview scroller.

The separate upstream MD042 rule retains its pre-existing advice that bare # links are empty. Such links remain functional and pass QuickMark MD051. User documentation explains the distinction; no other rule has been disabled or filtered.

## Profile identity correction (TASK-010.05.01)

The original integration left UI lint-state identity at v1 despite the engine/native v2 contract. The frontend identity now lives in dependency-free src/lint-identity.ts, re-exported by lint-profile.ts and lint-state.ts. State consumers do not load Markdown parsers. Native validation retains strict v2 compatibility; cross-layer tests compare its accepted identity with the engine/UI export and cover completed/stale transfer preservation and old-profile rejection. tests/manual/lint-profile-transfer.md records the standalone Windows review. This changes result labeling/transfer compatibility, not lint rules or persisted preferences.
