---
id: doc-009
title: Lint rule settings and configuration lifetime
type: specification
created_date: '2026-09-10 04:11'
tags:
  - markdown
  - linting
  - settings
  - task-010.04
---
# Approved TASK-010.04 design

The user approved these product choices before implementation. This document extends doc-008's fixed default profile with user rule switches; it does not change rendering, fixed rule options, inline-comment handling or advisory save decisions.

## Groups and controls

Each rule belongs to exactly one group. Group switches bulk-edit the member booleans, with checked, unchecked and mixed states. Clicking mixed enables all available members. Turning off and back on enables all available members rather than restoring historical choices. Expand Individual rules to see IDs/descriptions. Native fieldsets, legends, checkbox inputs and details/summary provide keyboard interaction and mixed-state semantics.

| Group | Rules |
| --- | --- |
| Headings | MD001, MD003, MD018–MD026, MD036, MD041, MD043 |
| Lists | MD004, MD005, MD007, MD029, MD030, MD032 |
| Spacing and blockquotes | MD009, MD010, MD012, MD013, MD027, MD028, MD047 |
| Code blocks and inline code | MD014, MD031, MD038, MD040, MD046, MD048 |
| Links, images and HTML | MD011, MD033, MD034, MD039, MD042, MD045, MD051, MD052, MD053, MD054, MD059 |
| Emphasis and names | MD037, MD044, MD049, MD050 |
| Tables and thematic breaks | MD035, MD055, MD056, MD058, MD060 |

MD034 is available but off by default: bare URLs are supported by QuickMark. MD051 is visibly unavailable and excluded from group operations until TASK-010.05 supplies aligned fragment validation and navigation. MD043/MD044 remain on by default but impose no outline/vocabulary constraints with their empty default option lists; the UI explains that limitation. Rule parameter editors, custom rules, project configuration discovery, auto-fix and live linting are outside scope.

Restore QuickMark Defaults clears rule overrides only. Lint before saving and unrelated preferences remain unchanged.

## Persistence and concurrent windows

Extend the native coordinator's lint-preference.json with a rules map, defaulting to an empty map when reading older files. The existing enabled/revision fields are preserved. The native coordinator mutex serializes patches, and each window submits only the individual or group members it changed. This prevents a stale full snapshot from reverting another window's unrelated choices. Later updates to the same rule win. Reset is an intentional global rule reset.

Validate rule IDs and boolean values at the native persistence boundary and worker entry. Unavailable MD051 is rejected. Write the temporary file and rename it before publishing a new revision or accepted controls. A failed write retains the previous accepted state and reports the failure. Existing idle polling reconciles revisions across windows; manual checks and save preflight obtain authoritative choices rather than depending on polling freshness.

## Configuration lifetime and results

The Settings catalog is independent of parser code. The worker receives an immutable override snapshot and overlays it on the fixed reviewed profile, preserving MD025/MD041 options when re-enabled. Effective configuration identity is a deterministic bit string in reviewed catalog order; explicit default values and missing overrides have the same identity.

Store that identity with tab results and validate it during frontend/native transfer. Legacy in-memory caches without the field mean the original default choices. Changed effective choices mark all cached completed/running results stale, disable source jumps and scroll synchronization, and prevent old manual worker replies from becoming current. No automatic rerun. Failures remain failures so preference-load errors cannot disappear behind a stale-results message.

Save preflight captures authoritative choices alongside its existing enabled decision. Retry and the remaining save transaction retain that immutable snapshot, even if another window changes settings. Its result remains a valid save decision for the captured configuration, while the tab cache becomes stale relative to current shared choices. Later saves and manual checks use the latest choices. Existing source/revision, ownership and filesystem guards still apply.

## Verification

Cover group mixed/off/on behavior, unavailable members, reset scope, failed persistence, legacy migration, restart, independent patches, manual/save agreement, retry capture, stale late responses and transferred results. Run frontend and native suites, production worker artifact checks and a standalone debug build. Verify actual WebKitGTK layout at normal and narrow widths and complete integrated user review across windows/restart before marking TASK-010.04 Done.
