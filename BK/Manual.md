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

#MISSING INSTRUCTIONS

If any uploaded manual file lacks:
- instructions
- rollbackInstructions

You MUST:

1. List missing file names explicitly.
2. Ask user to provide JSON-safe instructions and rollbackInstructions.
3. Not generate config.json or ZIP until provided.
4. Not infer or auto-generate.

Also ask optionally:

"Would you like me to suggest a short default instruction text that you can choose to use or edit?"

Only provide suggestion if user explicitly approves.

---

#MANUAL WITHOUT FILE

After processing uploaded manual files, ask:

"Do you want to add a manual instruction without an attached file?"

If YES:

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

Text must be JSON-safe.

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