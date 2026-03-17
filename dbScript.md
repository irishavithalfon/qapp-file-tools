#dbScript Domain Authority

This file governs ALL behavior related to:
- Stored Procedures
- SQL file handling
- Rollback scripts
- dbScript structure inside config.json
- Version-based rollback logic
- Forbidden SQL tokens

This file is a contractual authority.
If any instruction elsewhere contradicts this file, this file prevails for dbScript logic.

---

#INPUT RULES

Stored Procedures may be provided as:
- Individual SQL files
- A ZIP containing SQL files

Each SQL file represents EXACTLY ONE stored procedure.

You must fully extract any ZIP and perform a complete recursive file listing before processing.

You must not invent files.
You must not assume hidden files.
You must rely only on physically extracted files.

---

#STORED PROCEDURE HANDLING

For each stored procedure file:

1. Determine <ProcBase> from the file base name.
2. Save the original file at:
   Sql/StoredProcedures/<ProcBase>.sql

3. Detect the schema from SQL content.
   - If schema is clearly identifiable → use it.
   - If schema is missing or not identifiable → STOP and ask the user.
   - If detection is certain → do NOT ask for confirmation.

4. Generate a rollback drop script at:
   Sql/RB/IED<ProcBase>.sql

5. The drop script content must be EXACTLY:

   IF OBJECT_ID(N'[schema].[proc]', N'P') IS NOT NULL DROP PROCEDURE [schema].[proc];

6. No additional lines are allowed.
7. No comments allowed.
8. No formatting additions allowed.

---

#EMPTY ROLLBACK FILE

You MUST create a file named exactly:

Sql/RB/Empty.sql

This file must be empty.

---

#FORBIDDEN TOKEN RULE (CRITICAL)

The SQL batch separator token consisting of the letters G and O must NEVER appear anywhere in:
- Any SQL file
- Any generated JSON
- Any generated output

If it appears → HARD STOP immediately.

---

#VERSION-BASED ROLLBACK LOGIC

If version == "1.0.0":
    - rollbackPath for storedProcedure MUST be:
      Sql/RB/Empty.sql
    - Generate new id (GUID uppercase)

If version != "1.0.0":
    - You MUST ask the user how to handle rollback.
    - Present exactly two options:

Option 1:
    Use Empty.sql
    rollbackPath = Sql/RB/Empty.sql

Option 2:
    Use previous version stored procedure as rollback.
    - User MUST provide the previous version SQL file.
    - Save it under Sql/RB/
    - rollbackPath must point to that file.
    - If file not provided → HARD STOP.

The user choice must be explicit.

---

#dbScript CONTRACT RULES (MANDATORY)

Inside config.json:

A dbScript entry MUST NOT exist without:
- manualScript
- rollbackPath
- target

Violation → HARD STOP.

---

#DROP SCRIPT dbScript RULES

For each Drop script entry:

- name must start with "Drop "
- type = "script"
- manualScript = "false"
- rollbackPath must be identical to path

---

#STORED PROCEDURE dbScript RULES

For each storedProcedure entry:

- type = "storedProcedure"
- target = "qflow"
- manualScript = "false"
- rollbackPath must be EXACTLY:
  Sql/RB/Empty.sql

---

#ORDERING RULE (CRITICAL)

For each stored procedure:

1. First include the Drop script dbScript section.
2. Immediately after it include the storedProcedure dbScript section.

No other entries may separate them.

---

#CREATE KEYWORD RULE

The word CREATE is allowed.
It must not be modified or removed.

---

#FAILURE CONDITIONS

The following cause HARD STOP:

- Missing schema when required
- Additional content in Drop file
- Missing Empty.Sql
- Forbidden token usage
- Missing dbScript required fields
- Wrong ordering
- Missing explicit rollback choice (for version != 1.0.0)
- Referencing a file not extracted