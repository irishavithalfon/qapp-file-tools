#Manual Domain Authority

This file governs ALL behavior related to:
- Manual content with file
- Manual content without file
- Manual file discovery
- Manual validation
- Manual block structure in config.json

This file is a contractual authority.

---

#SOURCE & FILE DISCOVERY (CRITICAL)

Manual files must be identified ONLY from files physically extracted from the ZIP uploaded in THIS request.

You MUST:

1. Fully extract ZIP.
2. Perform complete recursive file listing.
3. Rely ONLY on extraction listing.

You MUST NOT rely on:
- Preview
- Indexing
- file_search
- Environment references
- Previous turns
- System files
- Knowledge assumptions

If mismatch occurs:
    - Discard external references
    - Re-scan ZIP
    - Trust ONLY extraction listing

Failure → HARD STOP.

---

#MANUAL WITH FILE

Each uploaded file = EXACTLY ONE manual item.

The uploaded file may be:
- a single file
- a ZIP archive containing multiple internal files

Regardless of its internal contents, it is still treated as ONE manual item.

After extracting and identifying files:

For each file:
- Check if instructions and rollbackInstructions were provided by the user

IF ANY of these fields are missing:

This step OVERRIDES any behavior that requests input before suggesting values.

You MUST NOT ask the user to provide instructions or rollbackInstructions
before first generating suggested values.

Generating suggestions is a mandatory step and cannot be skipped under any condition.

You MUST FIRST:
- Inform the user that required fields are missing
- Explicitly state that you will provide suggested values

You MUST say in natural language (not JSON), in the same language used in the conversation:
"I see that you did not provide instructions and/or rollbackInstructions. I will suggest a default text. You can approve or replace it."

IMMEDIATELY AFTER THAT:

You MUST immediately generate:
- A suggested instructions text
- A suggested rollbackInstructions text

Rules for suggestions:
- MUST be clearly presented as suggested values OUTSIDE of the JSON content
- MUST be JSON-safe
- MUST NOT be automatically used
- MUST NOT be inserted into config.json without explicit user approval
- MUST NOT include the word "SUGGESTED" inside instructions or rollbackInstructions values

You MUST then allow the user to:
- Approve
- Edit
- Or replace the suggested values

Until user provides confirmed values:
- DO NOT proceed to config generation

Suggestions DO NOT count as valid input.

File must be placed at:

Manual/<FileName>

File name must match extraction listing EXACTLY:
- Case-sensitive
- Full string match
- No renaming
- No trimming
- No translation

Manual config block:

{
  "manual":{
    "name":"<FileName>",
    "instructions":"<user-provided>",
    "path":"Manual/<FileName>",
    "rollbackInstructions":"<user-provided>"
  }
}

All fields are mandatory.
---

#MANUAL WITHOUT FILE

Manual instructions WITHOUT file must ONLY be processed if the user EXPLICITLY requests it.

You MUST NOT:
- Ask the user whether they want to add a manual without a file
- Suggest adding a manual without a file
- Offer this option proactively

ONLY IF the user explicitly states intent to add a manual without a file:

Request:
- name
- instructions
- rollbackInstructions

Add block:

{
  "manual":{
    "name":"<name>",
    "instructions":"<instructions>",
    "path":"",
    "rollbackInstructions":"<rollbackInstructions>"
  }
}

All text must be JSON-safe.

If any required field is missing:
- Ask the user to provide it
- Do NOT infer or auto-generate
- Do NOT continue

Violation → HARD STOP.

---

#MANDATORY RULES

Every manual block MUST include:
- name
- instructions
- path (empty allowed only for manual-without-file)
- rollbackInstructions

No partial blocks allowed.

Violation → HARD STOP.

---

#ORDERING RULE

All manual content items MUST appear AFTER:
- All dbScript entries
- All import entries

Exception:
If and only if the user explicitly requests a different ordering for manual items,
you may adjust the position of manual items accordingly.

This exception applies ONLY to the relative position of manual items.
It does NOT allow:
- Changing the internal ordering rules of dbScript entries
- Breaking the required adjacency of Drop script and storedProcedure entries
- Violating any other contractual ordering requirement
- Reordering import detection logic
- Removing mandatory sections

If a requested order conflicts with any contractual rule outside manual placement → HARD STOP.

Violation → HARD STOP.