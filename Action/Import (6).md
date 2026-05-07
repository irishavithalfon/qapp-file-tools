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
Script → Script
Brochure Profile → BrochureProfile
Info Page Profile → InfoPageProfile
Reception Point Profile → ReceptionPointProfile
Custom Page → CustomPage
Workflow Procedures → Procedure
Online Form Template → OnlineFormTemplate
Assistant → Assistant
Calendar Template → CalendarTemplate
Monitor Commands → MonitorCommand
Notification Template → NotificationTemplate
Alert Rules → AlertRule
Schedule → Schedule
Service Filter → ServiceFilter
Ticket → Ticket
Custom JavaScript → CustomJavaScript
Avatar Theme → AvatarTheme
Holiday Group → HolidayGroup

Service Profile → ServiceProfile
Skill Type → SkillType
Group → Group
Resource Type → ResourceType
Webhook v6.2 → Webhook
Application Event v6.2 → ApplicationEvent
Soft Key v6.2 → SoftKey

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

#CONFIG.JSON IMPORT SECTION (MANDATORY)

Whenever the package contains ANY import files, the `import` section MUST be generated in config.json.

Rules:
- Every import file MUST have a corresponding entry in the `import` array inside config.json.
- This is NON-OPTIONAL. It MUST NOT be skipped, omitted, or left empty.
- Each entry MUST include at minimum:
    - "name": the display name of the item
    - "type": the detected ImportType
    - "path": the file path inside the package (Import/<ImportType>/<FileName>.xml)
- Do NOT generate the final ZIP before the import section is fully written in config.json.

If import files exist and the import section is missing from config.json → HARD STOP.

---

#OVERRIDE ACTION

After detecting ImportType for ALL files:

1. Present to the user:
   - Each file name
   - Detected ImportType

2. Apply automatic overrideAction rules:

AUTOMATIC RULE — ContentTemplate:
    - If any file has ImportType = ContentTemplate:
        - Automatically set overrideAction: leave for that file.
        - Do NOT ask the user about this.
        - Do NOT wait for user confirmation.
        - Apply silently and proceed.

Default behavior for all other ImportTypes:
    - Do NOT add overrideAction field to config.json.
    - Proceed without overrideAction.

ONLY if the user explicitly asks to control override behavior for non-ContentTemplate files:

    Inform them that they can specify overrideAction values.

    Allowed overrideAction values:
    - override
    - leave
    - exception

    If the user chooses to specify overrideAction:
        - They MUST provide a value for each file.
        - Do not assume missing values.
        - Do not generate JSON until all values are provided.

You MUST NOT:
- Mention overrideAction for non-ContentTemplate files unless the user explicitly asks about it.
- Don't ask for confirmation before applying overrideAction: leave to ContentTemplate files.
- Generate JSON before resolving all decisions.

---

#FINAL PACKAGE MESSAGE

When the package (ZIP) is ready and presented to the user, you MUST include a summary note that states:

- For every ContentTemplate file: explicitly write that overrideAction: leave was applied, and include the file name.
- For all other ImportTypes: explicitly state that overrideAction was NOT applied, and that it can be added only if the user explicitly requests it.

Example:
    "overrideAction: leave was applied to [FileName].xml (ContentTemplate)"
    "No overrideAction was applied to [FileName].xml ([OtherImportType]) — overrideAction can be added to other import types only if you request it."

---

#FAILURE CONDITIONS

HARD STOP if:

- ImportType guessed
- Identification ambiguous without confirmation
- File referenced not extracted
- JSON generated before confirmation
- Partial scan performed