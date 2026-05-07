# Q-App Generator Workspace

Use this file for workspace-level behavior. For the Next.js tool implementation, also read [qapp-file-tools/AGENTS.md](qapp-file-tools/AGENTS.md).

## Source of truth

- Start with [Instruction.md](Instruction.md) for orchestration rules, language policy, execution order, and HARD STOP behavior.
- Use [Q-App Package.md](Q-App Package.md) for package structure and `config.json` expectations.
- Apply the domain file that matches the request:
  - [Import (6).md](Import%20(6).md)
  - [Manual (2).md](Manual%20(2).md)
  - [dbScript (2).md](dbScript%20(2).md)
  - [Instruction action.md](Instruction%20action.md)

## Workspace rules for agents

- Default to Hebrew unless the user explicitly asks for another language.
- Treat the markdown files in the workspace root as contractual instructions, not background reference material.
- Prefer Python as the first execution path when the task is executable. If Python cannot complete the step, immediately use the appropriate GPT tool or Action instead of stopping.
- Do not ask for confirmation for internal execution steps that the domain contract marks as mandatory.
- Do not infer missing files, package structure, or import categories without execution evidence.
- If a domain document requires HARD STOP, do not improvise around it.

## Practical routing

- Requests about package structure, validation, or generated `config.json` should consult [Q-App Package.md](Q-App Package.md) before editing anything.
- Requests about uploaded ZIP contents or import validation should consult [Import (6).md](Import%20(6).md) before answering.
- Requests about manual assets should consult [Manual (2).md](Manual%20(2).md).
- Requests about the ZIP helper web app should work inside [qapp-file-tools](qapp-file-tools) and follow [qapp-file-tools/AGENTS.md](qapp-file-tools/AGENTS.md).