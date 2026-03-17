# Q-App Package Specification (GPT-Optimized)

This document defines the structure, configuration schema, and content types of a Q-App package.

A Q-App is a single ZIP archive renamed to `.qapp`.

---

# 1. Q-App Structure

A Q-App must contain:

- config.json (at root level)
- Folders and files referenced by config.json

After packaging:
- ZIP the folder
- Rename extension from `.zip` to `.qapp`

---

# 2. config.json Schema

Every Q-App must include a file named:

config.json

## 2.1 Root Properties

```json
{
  "id": "GUID",
  "versionId": "GUID",
  "name": "string",
  "version": "major.minor.build",
  "logo": "path/to/logo.png",
  "description": "string",
  "developer": "string",
  "qflowVersions": ["6.0", "6.1+"],
  "license": [{ "module": "ModuleName" }],
  "requiredPreviousVersion": "major.minor",
  "defaultUpgradeAction": "override | leave",
  "defaultRemovedItemsAction": "remove | leave",
  "defaultOverrideAction": "override | leave | exception",
  "parameters": [],
  "dependencies": [],
  "content": []
}
```

---

## 2.2 id

- Unique GUID for the Q-App.
- Same for all versions of the same app.
- Must not be manually modified.

---

## 2.3 versionId

- Unique GUID per version.
- Must change on every version.

---

## 2.4 version

Format:

major.minor.build

Rules:
- Major → significant changes
- Minor → minor changes
- Build → internal tracking

---

## 2.5 qflowVersions

Defines supported Q-Flow versions.

Example:

```json
"qflowVersions": ["6.0", "6.1+"]
```

"6.1+" means version 6.1 and all future versions.

---

## 2.6 license

Optional.

```json
"license": [
  { "module": "Herald" },
  { "module": "Connect" }
]
```

Allowed module values:

AdvancedCalendar  
AdvancedQueueManagement  
AdvancedUXC  
API  
AutoFlow  
Brochure  
BrochureAPI  
Calendar  
Connect  
ExchangeBridge  
Herald  
Intercom  
OnlineForm  
PlannerAPI  
QueueManagement  
Staffing  
UserExperienceCustomization  
WindowsPrinting  

---

## 2.7 requiredPreviousVersion

Used when releasing partial updates.

Example:

```json
"requiredPreviousVersion": "1.0"
```

Only major + minor are supported.

---

## 2.8 Default Action Controls

### defaultUpgradeAction
Controls behavior when item already exists.

Values:
- override
- leave

Default: override

---

### defaultRemovedItemsAction
Controls behavior for items removed in new version.

Values:
- remove
- leave

Default: leave

---

### defaultOverrideAction
Applies only to:
- ContentTemplate
- Classification
- AppointmentType

Values:
- override
- leave
- exception

Default: exception

---

# 3. Parameters

Defines installation-time parameters.

Example:

```json
"parameters": [
  {
    "name": "@Parameter1",
    "type": "ServiceFilter",
    "required": "false",
    "description": "description"
  }
]
```

Rules:
- name must start with @
- no spaces
- if type = text → required must be true

Special types:
- ID
- Text

---

# 4. Dependencies

```json
"dependencies": [
  {
    "qappId": "GUID",
    "qappName": "App Name",
    "minimumVersion": "1.0.0",
    "downloadUrl": "URL"
  }
]
```

Installation blocked until dependency exists.

---

# 5. Content Node

Array of content actions.

Supported types:

- storage
- import
- dbScript
- manual

---

# 5.1 storage

Copies file/folder into Q-Flow Storage.

```json
{
  "storage": {
    "name": "Storage Files",
    "type": "folder | file",
    "path": "relative/path",
    "target": "storageContainer",
    "rollbackAction": "remove | leave",
    "upgradeAction": "override | leave"
  }
}
```

Note:
- Only single-level folders supported.
- Subfolders trigger exception.

---

# 5.2 import

Imports Q-Flow objects.

```json
{
  "import": {
    "name": "Item Name",
    "type": "ReceptionPointProfile",
    "path": "Import/file.xml",
    "createParameter": "@ParamName",
    "upgradeAction": "override | leave",
    "overrideAction": "override | leave | exception"
  }
}
```

Two object groups:

## Group 1 – Structured History (supports rollback)
Examples:
- Script
- BrochureProfile
- InfoPageProfile
- ReceptionPointProfile
- CustomPage
- Procedure
- Assistant
- CalendarTemplate
- Schedule
- ServiceFilter
- Ticket
- AvatarTheme
- HolidayGroup
- ServiceProfile
- SkillType
- Group
- ResourceType
- Webhook
- ApplicationEvent
- SoftKey

## Group 2 – Overwrite Only
- ContentTemplate
- Classification
- ServiceType
- NotificationProvider
- CustomRole
- EntityType
- QBPTask
- CustomApi (6.3+)

---

# 5.3 dbScript

Runs SQL against Q-Flow database.

```json
{
  "dbScript": {
    "name": "Script Name",
    "type": "storedProcedure | table | Data | Job | Script",
    "path": "Scripts/script.sql",
    "target": "qflow | attachment | dispatcher",
    "rollbackPath": "Scripts/rollback.sql",
    "manualScript": "false"
  }
}
```

Notes:
- SQL Server "GO" is NOT supported.
- Returned parameters must include:
  - ParameterName
  - ParameterValue
  - ParameterType (0 = ID, 1 = Text)

---

# 5.4 manual

Provides manual instructions or files.

```json
{
  "manual": {
    "name": "Item Name",
    "path": "file.dll",
    "instructions": "Install instructions",
    "rollbackInstructions": "Rollback instructions"
  }
}
```

---

# 6. Example config.json (Simplified)

```json
{
  "id": "GUID",
  "versionId": "GUID",
  "name": "Kiosk Demo Q-App",
  "version": "1.0.0",
  "logo": "Logos/logo.png",
  "description": "Demo",
  "developer": "Dev Team",
  "qflowVersions": ["6.0+"],
  "content": [
    { "import": {...} },
    { "dbScript": {...} },
    { "manual": {...} }
  ]
}
```

---

# 7. Packaging

1. Build folder structure.
2. Ensure config.json at root.
3. Zip folder.
4. Rename extension to `.qapp`.

---

# 8. Key Constraints

- Each content item name must remain consistent across versions.
- dbScript should include rollback logic.
- Avoid using generic fields for customization.
- Split DB objects into separate scripts.
- No SQL Server "GO" command allowed.

---

End of GPT-Optimized Specification.