---
id: TASK-028
title: Add automatic bracket pairing in the Markdown editor
status: To Do
assignee: []
created_date: '2026-09-16 01:40'
updated_date: '2026-09-18 01:56'
labels:
  - enhancement
  - editor
dependencies:
  - TASK-031
references:
  - TASK-016
priority: medium
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User requested a separate task for general automatic bracket completion during TASK-016 review. Add pairing for parentheses (), square brackets [] and braces {} while preserving Markdown editing and native input behavior. TASK-016 handles finishing a link when accepting a file; this task covers general typing. Creation is authorized; implementation has not been authorized.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typing an opening parenthesis, square bracket or brace inserts its matching closer in appropriate editing contexts and positions the caret between the pair.
- [ ] #2 Typing a matching closer skips an existing automatically inserted closer without duplicating it; backspace between an untouched pair removes the pair predictably.
- [ ] #3 Typing an opening delimiter with text selected wraps the selection without losing its contents.
- [ ] #4 Escaped delimiters, nested pairs, paste, composition input and read-only/busy editors are handled without corrupting content or interfering with existing Markdown shortcuts and path completion.
- [ ] #5 Automated interaction tests, user documentation and native keyboard review cover the supported behavior.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @Codex
created: 2026-09-18 01:56
---
Dependency added at the user's request: complete TASK-031's CodeMirror investigation before implementing this editor feature, so the work uses the approved editor foundation.
---
<!-- COMMENTS:END -->
