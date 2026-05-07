#dbScript Domain Authority

This file governs ALL behavior related to:
- Stored Procedures
- SQL file handling
- Rollback scripts
- Restore folder and file naming
- dbScript structure inside config.json
- Rollback logic
- Forbidden SQL tokens
- config.json validation

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

Create a file named exactly:

Sql/RB/Empty.sql

This file must be empty.

ONLY create this file if at least one stored procedure uses it as its rollbackPath.
If all stored procedures use a restore file, do NOT create Empty.sql.

---

#FORBIDDEN TOKEN RULE (CRITICAL)

The SQL batch separator token consisting of the letters G and O must NEVER appear anywhere in:
- Any SQL file
- Any generated JSON
- Any generated output

If it appears → HARD STOP immediately.

---

#ROLLBACK LOGIC

Regardless of the Q-App version, you MUST ask the user the following question before proceeding:

"Do you want to restore an old stored procedure (use a previous version as rollback)?"

If the user answers NO:
    - rollbackPath for each storedProcedure = Sql/RB/Empty.sql
    - Create Sql/RB/Empty.sql (empty file)

If the user answers YES:
    - Ask the user to upload or provide the previous version SQL files they want to restore.
    - For each provided restore file:
        - Save it as: Sql/Restore/<ProcBase>.Restore.sql
        - rollbackPath for that storedProcedure = Sql/Restore/<ProcBase>.Restore.sql
    - If restore files are not provided → HARD STOP.

The question must be asked explicitly.
The user's answer must be explicit before proceeding.

---

#RESTORE FOLDER AND FILE NAMING

If the user provides restored stored procedure files:

1. Place each restored file inside:
   Sql/Restore/

2. Each restored file must be named:
   <ProcBase>.Restore.sql

   Where <ProcBase> is the base name of the original procedure file.

   Example:
   Original:  cqf.ShortQueuesAlignQuantityCounterAndPcpForDate.sql
   Restored:  cqf.ShortQueuesAlignQuantityCounterAndPcpForDate.Restore.sql

3. rollbackPath in config.json must reference the exact path:
   Sql/Restore/<ProcBase>.Restore.sql

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
- rollbackPath must be EXACTLY one of:
  - Sql/RB/Empty.sql  (if user chose not to restore)
  - Sql/Restore/<ProcBase>.Restore.sql  (if user provided a restore file)

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

#CONFIG.JSON VALIDATION (MANDATORY)

After generating all files, verify that every path referenced in config.json actually exists in the final Q-App package.

- If a referenced file does not exist → HARD STOP.
- Do not reference Sql/RB/Empty.sql if that file was not created.
- Do not reference Sql/Restore/<ProcBase>.Restore.sql if that file was not provided and saved.

---

#FAILURE CONDITIONS

The following cause HARD STOP:

- Missing schema when required
- Additional content in Drop file
- Empty.sql created but not used by any stored procedure
- Empty.sql missing when at least one storedProcedure references it
- Forbidden token usage
- Missing dbScript required fields
- Wrong ordering
- Missing explicit rollback answer from user
- Restore files not provided when user answered yes to rollback
- Referencing a file not extracted
- config.json references a file that does not exist in the package