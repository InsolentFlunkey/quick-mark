---
id: doc-013
title: Relative path completion context and safety
type: specification
created_date: '2026-09-15 14:06'
updated_date: '2026-09-16 03:29'
tags:
  - editor
  - paths
---
# Relative path completion (TASK-016)

Completion is limited to inline Markdown link/image destinations (including angle-delimited destinations). It avoids code, absolute paths, URL schemes, reference-style labels and fragment/query text. Automatic lookup requires an explicit ./ or ../ path, so beginning a web URL does not open a file list. Ctrl+Space requests bare-filename suggestions, which continue narrowing within that destination until dismissed. Directory acceptance requests the next level.

An explicit chooser remains open when the current prefix has no supported matches. It identifies whether no document or image and folder names were found, announces the result through the existing live status, and preserves the explicit session while the user types or deletes characters. Widening or changing the prefix repopulates the options without another Ctrl+Space. Automatic empty results and filesystem errors remain unobtrusive.

Filename segments are percent-encoded, including Markdown punctuation; directories use portable forward slashes. File acceptance finishes missing delimiters and puts the caret after the closing parenthesis. Existing closers, titles/fragments and following prose are preserved. Directory acceptance keeps the caret inside the unfinished link.

Each editor has its own controller. Requests capture active document ID, filesystem path, source and caret; both replies and acceptance recheck these values plus focus/editability. Tab switches and tab disposal cancel pending display. Nothing is persisted or transferred between windows. Input events apply accepted changes through the existing document and preview path. Escape preserves the editor's focus-exit convention.

The native command shares relative target resolution and supported document/image rules with rendered resources. Parent-relative paths are supported consistently with links. Directory enumeration runs on the blocking pool, is nonrecursive, scans at most 10,000 entries and returns at most 100 matching entries. A truncation notice asks the user to narrow the path; very large directories can require manual typing. Results distinguish directories from the file kind supported in the current link/image context. No filesystem writes occur.

General bracket pairing is tracked separately in TASK-028 and is not implemented here. Native UI review is recorded separately in the task and tests/manual/path-completion.md.
