
<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

## Project workflow policy

These are project-specific policies layered on top of the Backlog.md workflow loaded above. Backlog.md governs task-management mechanics; these rules define additional constraints and preferences for this project.

If a rule below conflicts with the Backlog.md workflow, follow the Backlog.md workflow and inform me of the conflict.

Always make task changes through the Backlog.md tools — never hand-edit task files.

If Backlog.md is not found or is not initialized in this project, do not attempt workarounds. Inform me and ask how to proceed.

## Authorization boundaries

Do not interpret discussion, questions, analysis, or suggestions as permission to make changes.

Questions such as "what would you change?", "how should we fix this?", "is this a good idea?", or "what do you recommend?" are requests for analysis only.

Unless explicitly authorized by my request:

- Do not delete files.
- Do not create commits.
- Do not begin work on an existing Backlog task.
- Do not begin unrelated or follow-up work.
- Do not apply workarounds that bypass an unresolved problem.

A request to implement a non-trivial change does authorize creation of the Backlog task or tasks necessary to track that requested work. It does not authorize beginning unrelated existing tasks or additional follow-up work that is discovered while implementing it.

## Task creation and scope

For any non-trivial change, create the necessary task or tasks BEFORE writing code. Do not implement untracked non-trivial work.

A change is non-trivial if it requires meaningful implementation effort, affects multiple files or components, has meaningful behavioral or visual impact, introduces a risk of regression, or requires explicit verification.

Very small, localized changes that are low-risk and straightforward to verify may be performed without creating a task. When uncertain whether a change is trivial, discuss it with me before proceeding.

When creating tasks:

- Search existing tasks first to avoid duplicates. Extend or reference an existing task instead of creating a near-copy when appropriate.
- Give every task at least one concrete acceptance criterion that defines "done."
- Label every task as bug, feature, or enhancement.
- Keep tasks independently understandable, implementable, and verifiable while also keeping them reasonably sized.
- Do not split tightly coupled implementation details into separate tasks merely because they affect different files or components.
- Split large changes into multiple tasks when they contain distinct implementation stages, independently verifiable milestones, or enough work that completing and reviewing the change as one unit would be unwieldy.
- When new tasks are created, suggest to the user that they be committed in a dedicated commit.  Do not leave uncommitted task files hanging in the project.

Broad goals that require substantial changes across a project should normally be represented by multiple tasks covering meaningful milestones rather than one oversized task.

## Problem and blocker handling

When a problem is encountered, do not silently bypass, suppress, or work around it merely to make the immediate task succeed while leaving the underlying problem unresolved.

Report the root problem first. If a workaround is appropriate, explain it and get my approval before using it.

Examples include, but are not limited to:

- Missing tool installations
- Missing configurations
- Command failures due to insufficient privileges
- Build, test, dependency, or environment failures

If a problem blocks completion of the current task, report the blocker and suggest ways to resolve it rather than changing the intended outcome or hiding the failure.

If unrelated bugs, enhancements, or additional work are discovered while implementing a task:

- Do not silently fix them.
- Do not expand the scope of the current task to include them.
- Report them to me and recommend a separate task when appropriate.
- Create the additional task if required by the Backlog.md workflow, but do not begin work on it without my approval.

## While working

- Move a task to In Progress when you begin implementing it.
- Record meaningful progress, decisions, and gotchas in the task as work proceeds rather than only at the end.
- Do not scope-creep an in-progress task. Newly discovered work should be handled according to the problem and blocker rules above.
- Reference the task ID in commit messages.

## Finishing a task

Mark a task Done only when every acceptance criterion has been met and verified.

If the project is a Git repository, use this completion sequence:

1. Complete the implementation.
2. Verify every acceptance criterion.
3. Mark the associated Backlog task Done so its completed task metadata is part of the same repository state as the implementation.
4. Ask me whether to commit.
5. Only after I approve, commit the implementation and its associated completed task file together.

Do not leave a task-status change for completed work to be committed later with unrelated changes.

When committing:

- Never commit without my explicit approval.
- Make one commit per completed task.
- Include only changes associated with that task.
- Use a concise imperative summary line prefixed with the task ID, for example: `task-12: add retry logic to upload handler`.
- Add a short commit-message body only when the change is not self-explanatory.
- Do not add the "Co-authored by..." line to the commit message.

Capture non-obvious architectural or design decisions as a Backlog doc so the reasoning is preserved.

When reporting a completed task, include a short manual verification checklist: concrete UI steps I can follow to confirm the change behaves as expected, with the outcome to look for at each step.

- Write it as actions and expected results, not a restatement of the acceptance criteria.
- Name the specific control for each step. Avoid wording that could describe more than one control, such as saying an item is "selected" when the page has both a dropdown and a list.
- Cover the main path plus anything easy to get wrong, such as what survives a reload or how the change interacts with another tool.
- Note deliberate but non-obvious behavior inline so it does not read as a defect.

After completing the current work, recommend a next step:

- If To Do tasks remain in the backlog, suggest the most logical one to take on next.
- If no To Do tasks remain but additional bugs, enhancements, or follow-up work are known, suggest adding appropriate task or tasks to the backlog.

Suggest only. Do not begin the next task without my approval.

## Picking up existing work

When I say "what's next" or "continue," check the board and identify the highest-priority appropriate To Do task.

Do not begin implementing it unless my wording clearly authorizes you to continue with the work. If I am only asking what the next task is, identify and recommend it without starting implementation.

## User Notes File

If the project contains a file named `user-notes.md`, this file is for user notes to be discussed, investigated and/or turned into Backlog.md tasks.  Check this file periodically for updates, and if any are found bring them up to the user for discussion.
