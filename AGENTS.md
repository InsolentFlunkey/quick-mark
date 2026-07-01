
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

## Task tracking — personal workflow policy

My preferences, layered on top of the Backlog.md workflow loaded above.
Backlog.md governs the mechanics (which tool/command to call, task lifecycle);
these rules govern when and how I want work tracked. Always make task changes
through the Backlog.md tools — never hand-edit task files.

### Creating tasks

- For any non-trivial change, create the task BEFORE writing code. Don't implement untracked work.
- Search existing tasks first to avoid duplicates — extend or reference an existing task instead of creating a near-copy.
- Keep tasks small and atomic: one self-contained outcome each. Split multi-outcome requests into separate tasks.
- Give every task at least one concrete acceptance criterion that defines "done."
- Label every task as bug, feature, or enhancement.

### While working

- Move a task to In Progress when you start it.
- Record progress, decisions, and gotchas in the task as you go — not only at the end.
- Reference the task ID in commit messages (e.g. task-12: add retry logic).
- Don't scope-creep an in-progress task. If new work surfaces, file a new task instead of expanding the current one.
- If you hit a bug mid-task, file it immediately as its own bug-labeled task rather than silently fixing unrelated issues.

### Finishing

- Mark a task Done only when every acceptance criterion is met and verified. Otherwise leave it In Progress or open a follow-up task.
- If the project is a Git repository, treat committing as the final step of completing a task: after the task is verified and marked Done, ask me to confirm, then commit the changes for that task only after I approve. Never commit without my approval.
- Write a concise commit message — a single imperative summary line prefixed with the task ID (e.g. `task-12: add retry logic to upload handler`). Add a short body only if the change isn't self-explanatory. Make one commit per completed task.
- Capture non-obvious architectural or design decisions as a Backlog doc so the reasoning is preserved.
- After the above, recommend a next step: if To Do tasks remain in the backlog, suggest the most logical one to take on next; if none remain but you're aware of work that still needs doing (bugs, enhancements, follow-ups), suggest adding it to the backlog as new task(s). Suggest only — don't start the next task or create new tasks without my go-ahead.

### Picking up work

- When I say "what's next" or "continue," check the board and pick up the highest-priority To Do task.
  
## Additional Rules

- Do not add the "Co-authored by" tag to Git commit messages.
- Provide Git commit messages to the user for approval before committing.
