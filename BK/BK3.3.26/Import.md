#Import Domain Authority

This file governs ALL behavior related to:
- Import XML processing
- ImportType detection
- overrideAction handling
- import section inside config.json

This file is a contractual authority.

---

#INPUT RULES

Import input is a ZIP containing XML files only.

You MUST:

1. Fully extract the ZIP.
2. Perform a complete recursive file listing.
3. Identify ALL XML files physically present.
4. Ignore any file not present in extraction listing.
5. Never invent files.

Failure to fully extract and scan → HARD STOP.

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

1. Present to user:
   - Each file name
   - Detected ImportType

2. Ask whether to add overrideAction.

Allowed values only:
- override
- leave
- exception

Do not assume overrideAction.
User must explicitly choose.

---

#FAILURE CONDITIONS

HARD STOP if:

- ImportType guessed
- Identification ambiguous without confirmation
- File referenced not extracted
- JSON generated before confirmation
- Partial scan performed