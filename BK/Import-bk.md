#Import Domain Authority

This file governs ALL behavior related to:
- Import XML processing
- ImportType detection
- overrideAction handling
- import section inside config.json

This file is a contractual authority.

---
#IMMEDIATE EXTRACTION ENFORCEMENT (CRITICAL)

The Import ZIP MUST be fully extracted immediately after the user uploads it.

This extraction:
- MUST occur automatically.
- MUST NOT require user confirmation.
- MUST NOT ask for permission.
- MUST NOT wait for approval.
- MUST NOT announce an intention to extract instead of extracting.
- MUST occur BEFORE any ImportType detection.
- MUST occur BEFORE presenting any “current status” summary.

Only AFTER extraction and a complete recursive file listing:
- Proceed to ImportType detection.
- If ambiguity exists → STOP and ask for explicit user confirmation.
- Otherwise → present the detected ImportTypes.

If extraction is not performed immediately → HARD STOP.
---
#STRUCTURAL VALIDATION RESPONSIBILITY (CRITICAL)

The system is solely responsible for validating the structure and contents of the Import ZIP.

You MUST:

- Verify that the ZIP contains XML files only.
- Detect any non-XML files.
- Detect empty folders.
- Detect nested ZIP files.
- Detect unsupported file types.
- Detect any structural anomalies.

Structural validation is a mandatory internal execution step.

You MUST NOT:
- Ask the user to confirm whether the ZIP contains only XML files.
- Delegate structural validation to the user.
- Pause the process to request structural confirmation.
- Rely on user statements about ZIP contents.

If any non-XML file exists → HARD STOP.
If unsupported structure exists → HARD STOP.
If structural validation is skipped → HARD STOP.

Structural validation must be completed automatically immediately after extraction and before ImportType detection.
---

#IMPORT TYPE DETECTION

ImportType MUST be identified using:

- XML root element
- XML attributes
- XML internal structure

You MUST NOT use:
- File names
- Folder names
- Assumptions
- Heuristics
- Prior examples

If identification is not unambiguous:
    - STOP
    - State exactly which ImportType options are possible
    - Confirm that all files were reviewed
    - Ask for explicit user confirmation
    - Do not generate JSON or ZIP

---

#OFFICIAL MAPPING KNOWLEDGE

Content Template + Category → ContentTemplate  
Classifications + Classification Groups → Classification  
Service Type + Appointment Types → ServiceType  
Connect Channel Provider v6.2 → NotificationProvider  
Custom Role (and tasks) v6.2 → CustomRole  
Entity Type v6.2 → EntityType  
QBP (except built-in QBPs) v6.2 → QBPTask  
Custom API v6.3 → CustomApi (supported from Q-Flow 6.3)

---

#SPECIAL CERTAINTY RULE

If XML contains BOTH:
- ContentTemplate
- ContentCategory

At root or nested level:

ImportType is CERTAINLY:
ContentTemplate

This is NOT ambiguous.

---

#FILE PLACEMENT RULE

Each XML file must be placed at:

Import/<ImportType>/<FileName>.xml

---

#OVERRIDE ACTION

After detecting ImportType for ALL files:

1. Present to the user:
   - Each file name
   - Detected ImportType

2. Ask the user whether they want to:
   - Explicitly specify overrideAction values
   OR
   - Use the system default behavior

Allowed overrideAction values:
- override
- leave
- exception

If the user chooses to specify overrideAction:
    - They MUST provide a value for each file.
    - Do not assume missing values.
    - Do not generate JSON until all values are provided.

If the user chooses default behavior:
    - Do NOT add overrideAction field to config.json.
    - Proceed without overrideAction.

You MUST NOT:
- Assume overrideAction automatically.
- Force overrideAction if the user selects default behavior.
- Generate JSON before resolving this decision.

---

#FAILURE CONDITIONS

HARD STOP if:

- ImportType guessed
- Identification ambiguous without confirmation
- File referenced not extracted
- JSON generated before confirmation
- Partial scan performed