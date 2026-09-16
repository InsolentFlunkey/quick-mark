# Agent Workflow

This document defines the detailed development workflow for AI agents working in this repository.

The root `AGENTS.md` contains the rules that apply at all times. Consult this document when creating, executing, verifying, or completing tracked work.

## Backlog.md

This project uses Backlog.md for task and project management.

Follow the Backlog.md MCP workflow and use Backlog.md tools for all task changes. Never manually edit Backlog task files.

If Backlog.md is unavailable or the project is not initialized, stop and inform the user rather than attempting a workaround.

Do not repeatedly reload Backlog instructions that are already available in the current context unless the relevant details are no longer available or must be verified.

## Authorization

Discussion is not authorization to make changes.

Questions such as the following request analysis or recommendations only unless the user explicitly authorizes implementation:

* "What would you change?"
* "How should we fix this?"
* "Is this a good idea?"
* "What do you recommend?"
* "What's next?"

Without explicit authorization, do not:

* Modify files.
* Delete files.
* Begin an existing Backlog task.
* Create commits.
* Begin unrelated or follow-up work.
* Apply a workaround that leaves an identified problem unresolved.

An explicit request to implement a change authorizes work necessary for that requested change, including creation of required Backlog tasks.

It does not authorize unrelated existing tasks or newly discovered follow-up work.

## Determining Whether a Task Is Required

Create a Backlog task before implementing any non-trivial change.

Treat work as non-trivial when one or more of the following apply:

* It requires meaningful implementation effort.
* It affects multiple files or components.
* It changes significant behavior or UI.
* It has meaningful regression risk.
* It requires explicit verification.
* It introduces or changes an architectural decision.

Small, localized, low-risk changes may be performed without a task.

If it is genuinely unclear whether a change should be tracked, ask before implementing it.

## Creating Tasks

Before creating a task:

1. Search existing tasks for the same or closely related work.
2. Prefer extending or referencing an existing task instead of creating a duplicate when appropriate.
3. Determine whether the requested work is best represented by one task or several meaningful milestones.

Every task must:

* Have at least one concrete acceptance criterion.
* Be labeled `bug`, `feature`, or `enhancement`.
* Be independently understandable.
* Be implementable and verifiable at a reasonable scope.

Do not split tightly coupled implementation details into separate tasks merely because they affect different files or components.

Split large efforts when they contain:

* Distinct implementation stages.
* Independently verifiable milestones.
* Substantial unrelated concerns.
* Enough work that implementation and review as one task would be unwieldy.

A task created immediately before implementation should normally be committed with that implementation.

If a task is created only to record future work, suggest committing the task file separately rather than leaving it uncommitted.

## Beginning Implementation

Before writing code for a tracked task:

1. Confirm that the task represents the authorized work.
2. Move the task to In Progress.
3. Review its acceptance criteria.
4. Inspect only the parts of the repository reasonably relevant to the work.

Prefer targeted repository exploration over broad searches when likely files or components are already known.

Do not refactor unrelated code while implementing a task.

## While Working

Record meaningful information in the task as work proceeds.

Useful information includes:

* Important implementation decisions.
* Unexpected constraints.
* Non-obvious behavior.
* Significant debugging findings.
* Gotchas that may matter later.
* Changes to the planned implementation that remain within task scope.

Do not add routine command output or trivial implementation details simply to create a running log.

Keep implementation within the task's authorized scope.

## Blockers and Failures

Do not silently bypass a problem to make the immediate task appear successful.

Examples include:

* Missing tools.
* Missing configuration.
* Dependency failures.
* Build failures.
* Test failures.
* Permission failures.
* Environment problems.
* Unsupported platform behavior.

When a blocker occurs:

1. Identify and report the underlying problem.
2. Explain its effect on the current task.
3. Suggest reasonable resolutions.
4. If a workaround would leave the underlying issue unresolved, obtain approval before applying it.

Do not suppress failing checks, weaken validation, skip required behavior, or change the requested outcome solely to make verification pass.

## Newly Discovered Work

If an unrelated bug, enhancement, cleanup, or follow-up issue is discovered:

* Do not fix it as part of the current task.
* Do not expand the current task's scope to include it.
* Report it to the user.
* Recommend a separate Backlog task when appropriate.
* Create that task if required by the Backlog.md workflow.
* Do not begin the new task without authorization.

Minor observations that do not warrant tracking may simply be reported.

## Verification

Use the narrowest verification that is sufficient for the change.

During implementation:

* Run tests directly related to the modified code first.
* Do not run the full test suite after every small change by default.
* Do not rerun unchanged passing tests after every edit unless the edit could reasonably affect them.
* Prefer targeted tests, checks, type-checks, or builds appropriate to the modified area.

Run broader verification when:

* The change affects shared infrastructure.
* The change crosses frontend/backend or other component boundaries.
* The change affects behavior used by many parts of the application.
* Targeted tests are insufficient to establish correctness.
* The task has meaningful regression risk.
* The acceptance criteria explicitly require broader verification.

For Rust changes, prefer the narrowest relevant check or test target.

Examples include:

```text
cargo check
```

```text
cargo test <test-name>
```

or an appropriate package, module, integration-test, or test-target command when applicable.

Run the full Rust test suite only when broader regression coverage is warranted.

For frontend changes, run the most relevant targeted test, type-check, lint, or build command.

Do not run every frontend test after every small update unless the change has broad impact.

If no relevant automated test exists, use the most appropriate build, static check, or manual verification instead.

Do not assume verification command names that are not defined by the project.

If verification cannot be completed, do not claim the task is complete. Report what was verified and what remains unresolved.

## Completing a Task

Mark a task Done only after every acceptance criterion has been met and verified.

For Git repositories, use this sequence:

1. Complete implementation.
2. Verify every acceptance criterion.
3. Update the Backlog task with relevant final information.
4. Mark the task Done.
5. Ask the user whether to commit.
6. Only after explicit approval, commit the implementation and completed task metadata together.

Do not commit automatically.

Do not leave completed task-status changes to be committed later with unrelated work.

## Commits

Use one commit per completed task.

Each commit should contain only changes associated with that task.

Use an imperative commit subject prefixed by the task ID.

Example:

```text
task-12: add retry logic to upload handler
```

Add a short commit-message body only when the change is not self-explanatory.

Do not add `Co-authored-by` or similar AI attribution trailers.

Never create a commit without explicit user approval.

## Architectural Decisions

Record non-obvious architectural or design decisions as a Backlog document when preserving the reasoning will help future work.

Examples include:

* Choosing one persistence strategy over another.
* Introducing a new application boundary.
* Selecting a library that materially affects future implementation.
* Deliberately accepting an important tradeoff.
* Establishing behavior that might otherwise look accidental.

Do not create architectural documentation for routine implementation choices.

## Completion Report

When reporting a completed task, include a short manual verification checklist.

Write the checklist as concrete user actions with expected results.

For example:

1. Open an existing Markdown document.

   * The document appears in the editor with its current contents.

2. Modify the document and select **File > Save**.

   * The file is saved and the modified-state indicator clears.

Prefer exact control names over ambiguous descriptions.

Cover:

* The primary workflow.
* Important state transitions.
* Behavior likely to regress.
* Persistence across reload or restart when relevant.
* Interaction with another control or feature when relevant.

Mention deliberate but non-obvious behavior so the user does not mistake it for a defect.

## Next Work

After completing the current work, suggest, but do not begin, the most logical next step.

If To Do tasks remain, recommend an appropriate next task.

If no To Do tasks remain but known follow-up work exists, suggest creating suitable tasks.

When the user asks only "what's next," inspect the board and recommend the highest-priority appropriate To Do task without starting implementation.

When the user explicitly asks to continue working, proceed with the authorized task according to this workflow.

## User Notes

If `user-notes.md` exists, periodically check it for new topics that need discussion, investigation, or conversion into Backlog tasks.

After a topic has been addressed through discussion or task creation, ask permission before removing it from `user-notes.md`.
