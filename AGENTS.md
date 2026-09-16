# Agent Instructions

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## Backlog Workflow Instructions

This project uses Backlog.md MCP for all task and project management activities.

**Critical guidance:**

* If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
* If your client only supports tools, or the resource request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.
* If this is your first time working in this project, read the overview before creating or modifying tasks.
* If the overview is already available in the current context, do not reload it unnecessarily.
* Read detailed Backlog instructions only when relevant to the current lifecycle phase.

The Backlog.md workflow governs task-management mechanics.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

## Project Rules

These project-specific rules supplement the Backlog.md workflow.

If a rule here conflicts with Backlog.md, follow Backlog.md and inform the user of the conflict.

Always modify Backlog tasks through Backlog.md tools. Never hand-edit task files.

If Backlog.md is unavailable or is not initialized for this project, stop and ask how to proceed.

## Authorization

**Analysis is not authorization.**

Questions, reviews, recommendations, planning, and discussion do not authorize file changes, task execution, commits, or follow-up work.

Unless explicitly authorized:

* Do not delete files.
* Do not create commits.
* Do not begin an existing Backlog task.
* Do not perform unrelated or follow-up work.
* Do not bypass an unresolved problem with a workaround.

An explicit request to implement a change authorizes the work necessary for that requested change, including creation of required Backlog tasks.

It does not authorize unrelated existing tasks or newly discovered follow-up work.

## Core Workflow Rules

* Create a Backlog task before implementing any non-trivial change.
* Move a tracked task to In Progress before implementation begins.
* Keep implementation within the authorized task scope.
* Do not silently fix unrelated issues.
* Do not silently work around blockers.
* Record meaningful progress, decisions, and gotchas in the task.
* Mark a task Done only after all acceptance criteria have been met and verified.
* Never commit without explicit user approval.
* Use one commit per completed task.
* Include the Backlog task ID in commit messages.
* Provide a short manual verification checklist when reporting completed work.
* Suggest follow-up work, but do not begin it without authorization.

## Reference Documents

Read referenced project documents only when relevant to the current work.

Within a conversation, do not re-read a document that has already been read unless its contents may have changed, relevant details are no longer available in context, or an exact rule must be verified.

Do not repeatedly read documentation merely to refresh context that is already available.

Detailed guidance:

* `docs/agent-workflow.md` — consult when first entering a tracked-work lifecycle phase, or when detailed task workflow rules are needed.

For project structure and implementation details, inspect the relevant repository files as needed. The repository is the authoritative source for the current architecture.

## User Notes

If `user-notes.md` exists, periodically check it for new topics that need discussion, investigation, or conversion into Backlog tasks.

After a topic has been addressed, ask permission before removing it from `user-notes.md`.
