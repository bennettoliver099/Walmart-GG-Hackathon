# Airtable Interface Extension SDK Rules

> **Single source of truth for Airtable Interface Extension SDK rules, patterns, and setup.**
>
> **FOR ALL COLLABORATORS (human and Claude):** Read this before writing extension code.
> If you discover new patterns, gotchas, or corrections while building, UPDATE THIS FILE
> so everyone benefits. This is a living document.

---

## Setup & Prerequisites

### Requirements
- Node.js v18+ (`brew install node`), npm 9+, Git
- Airtable account on Team/Business/Enterprise Scale plan

### Personal Access Token (PAT)
Create at: https://airtable.com/create/tokens

| Scope | Needed for |
|-------|-----------|
| `block:manage` | Extensions (dev + release) |
| `schema.bases:read` | Read base schema |
| `data.records:read` | Read records |
| `data.records:write` | Write records (if extension edits data) |
| `schema.bases:write` | Schema scripts (and MCP server if/when working) |

Grant access to specific bases, not all.

### Blocks CLI
```bash
npm install -g @airtable/blocks-cli
block set-api-key <YOUR_PAT>
```
PAT stored in: `~/.config/.airtableblocksrc.json`

### MCP Server (for Claude Code) — NOT YET WORKING

> **Status: Attempted on Day 1, fell back to REST API.** The `airtable-mcp-server` package exists but has not been verified working with our setup. Don't spend time configuring this until someone gets it running and updates this section. Use the Airtable REST API (`GET /v0/meta/bases/{id}/tables`) for schema queries instead.

Config template (for when someone gets it working):
```json
{
  "mcpServers": {
    "airtable": {
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": { "AIRTABLE_API_KEY": "patXXXXXX" }
    }
  }
}
```
File location: `~/.claude/mcp_settings.json`. Restart Claude Code after editing. Verify with `/mcp`.

### New Extension Project

**Always use `block init` to set up a new extension project.** Even if you already have the code, you must run `block init` to register the project with the CLI. Interface extensions use `NONE` as the baseId (not the actual base ID).

```bash
# Register extension in Airtable Builder Hub first, then:
block init NONE/blkXXXXXXXXXX --template=https://github.com/Airtable/interface-extensions-hello-world my_extension
cd my_extension && npm install
block run --port 9003
```

**Gotcha**: If you manually create `.block/remote.json` instead of running `block init`, releases will silently fail (CLI says success but nothing shows in Builder Hub). The `baseId` for interface extensions must always be `"NONE"`.

Then in Airtable: Interface Designer (edit mode) → Add element → Custom visualization → "Run local development extension"

### Release & Distribution
```bash
echo "Your release note" | block release
```
Then: Interface Designer → Add Custom visualization → paste unlisted link from Builder Hub.
For team distribution: Builder Hub → Distribution → generate unlisted link (same Enterprise account).

### Starter Repos
- JS: https://github.com/Airtable/interface-extensions-hello-world
- TS: https://github.com/Airtable/interface-extensions-hello-world-typescript
- Heatmap: https://github.com/Airtable/interface-extensions-heatmap

---

## Import Paths (CRITICAL — #1 Source of Bugs)

```javascript
// CORRECT — Interface Extensions
import {
    initializeBlock, useBase, useRecords, useCustomProperties,
    useColorScheme, useSession, expandRecord, colorUtils
} from '@airtable/blocks/interface/ui';
import { FieldType } from '@airtable/blocks/interface/models';

// WRONG — these are for regular blocks, NOT interface extensions
// import { ... } from '@airtable/blocks/ui';
// import { ... } from '@airtable/blocks/models';
```

The ONLY two valid import paths are:
- `@airtable/blocks/interface/ui`
- `@airtable/blocks/interface/models`

Do NOT import Airtable UI components (`Box`, `Button`, `Input`, etc.) — they are not available in interface extensions.

---

## Entry Point

Every extension's `frontend/index.js` must end with:

```javascript
initializeBlock({ interface: () => <MyComponent /> });
```

The `{ interface: ... }` wrapper is required. Without it, nothing renders.

---

## Field Access (CRITICAL)

```javascript
// CORRECT — safe, returns null if field missing
const field = table.getFieldIfExists('Field Name');

// WRONG — these throw errors
// table.getField('Field Name')
// table.getFieldByName('Field Name')
// table.getFieldById('fldXXXXXX')
```

Always check for null before using a field. Better yet, use these battle-tested helpers:

```javascript
function safeGetCellValue(record, fieldName) {
    try { return record.getCellValue(fieldName); }
    catch (e) { return null; }
}

function safeGetCellValueAsString(record, fieldName) {
    try { return record.getCellValueAsString(fieldName); }
    catch (e) { return ''; }
}
```

---

## Never Hardcode Field Names or Table Names

Use **custom properties** so interface designers can configure mappings in the UI.

> **Note:** MCP for Airtable is not yet working in our setup. Custom properties
> and `safeGetCellValue()` are the defensive patterns. If someone gets MCP running,
> update the Setup section above.

```javascript
import { useCustomProperties } from '@airtable/blocks/interface/ui';
import { FieldType } from '@airtable/blocks/interface/models';

// Define OUTSIDE the component (or wrap in useCallback) for stable identity
function getCustomProperties(base) {
    const table = base.tables[0];
    return [
        {
            key: 'dataTable',
            label: 'Data Table',
            type: 'table',
            defaultValue: table,
        },
        {
            key: 'nameField',
            label: 'Name Field',
            type: 'field',
            table,
            shouldFieldBeAllowed: (f) => f.config.type === FieldType.SINGLE_LINE_TEXT,
            defaultValue: table.fields.find(f => f.name.toLowerCase().includes('name')),
        },
    ];
}

function MyApp() {
    const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
    // Access: customPropertyValueByKey.dataTable, customPropertyValueByKey.nameField
}
```

### Custom Property Types

| Type | Returns | Use For |
|------|---------|---------|
| `table` | `Table` object | Letting builders pick which table |
| `field` | `Field` object | Mapping fields (use `shouldFieldBeAllowed` to filter by type) |
| `enum` | `string` | Predefined choices (`possibleValues: [{value, label}]`) |
| `boolean` | `boolean` | Toggles |
| `string` | `string` | Free text, API keys, labels |

Rules:
- Always provide a `defaultValue`
- Use `shouldFieldBeAllowed` to filter fields to relevant types
- Show setup instructions only when properties aren't yet configured
- Store third-party credentials as string custom properties, never in code

### Multi-Table Custom Properties

```javascript
function getCustomProperties(base) {
    return [
        {
            key: 'projectsTable',
            label: 'Projects Table',
            type: 'table',
            defaultValue: base.tables.find(t => t.name.toLowerCase().includes('projects')),
        },
        {
            key: 'tasksTable',
            label: 'Tasks Table',
            type: 'table',
            defaultValue: base.tables.find(t => t.name.toLowerCase().includes('tasks')),
        },
    ];
}
```

---

## Field Value Types

| Field Type | `getCellValue()` Returns | Gotchas |
|------------|-------------------------|---------|
| Single Select | `{id, name, color}` or `null` | Render `.name`, not the object |
| Multiple Selects | `Array<{id, name, color}>` or `null` | |
| Linked Records | `Array<{id, name}>` or `null` | Always check `.length` |
| Checkbox | `true` or `null` | **NOT `false`** — unchecked = `null` |
| Collaborator | `{id, email, name}` or `null` | |
| Attachments | `Array<{id, url, filename, ...}>` or `null` | |
| Number/Currency/Percent | `number` or `null` | Percent: 0.5 = 50% |
| Date/DateTime | `string` (ISO) or `null` | |
| Text/URL/Email/Phone | `string` or `null` | |
| Formula/Rollup/Lookup | Varies by result type | |

Use `colorUtils.getHexForColor(option.color)` for select field colors.
Use `getCellValueAsString(field)` when you just need display text.

**Date comparison gotcha:** `getCellValueAsString()` on date fields returns locale-formatted text (e.g., "2/13/2026"), NOT ISO format. For date comparisons, use `getCellValue()` which returns `"YYYY-MM-DD"` ISO strings.

---

## Writing Data

```javascript
// ALWAYS check permissions first
if (table.hasPermissionToCreateRecords()) {
    await table.createRecordAsync({ 'Field Name': value });
}
if (table.hasPermissionToUpdateRecords()) {
    await table.updateRecordAsync(recordId, { 'Field Name': newValue });
}
if (table.hasPermissionToDeleteRecords()) {
    await table.deleteRecordAsync(recordId);
}
```

- Max **50 records** per create/update/delete call
- Max **15 API calls per second**
- Chunk and `await` for large operations

For linked record fields, search possible values with:
```javascript
const results = await record.fetchForeignRecordsAsync(field, 'search text');
// results.records = [{ displayName, id }, ...]
```

---

## Record Detail Pages

Preferred over custom detail views:

```javascript
import { expandRecord } from '@airtable/blocks/interface/ui';

if (table.hasPermissionToExpandRecords()) {
    <div onClick={() => expandRecord(record)}>View Details</div>
}
```

---

## Styling

- **Tailwind** is pre-configured (no import needed)
- **Always support dark mode:** `dark:` Tailwind prefix, or `useColorScheme()` hook, or `prefers-color-scheme` CSS
- **Fill the container:** `min-h-screen w-full` or equivalent
- **Icons:** `@phosphor-icons/react` — always append `Icon` suffix (`ArrowRightIcon`, not `ArrowRight`)

---

## Third-Party Libraries

| Purpose | Library |
|---------|---------|
| Charts | `recharts` |
| Icons | `@phosphor-icons/react` |
| Maps | `mapbox-gl` (also import `mapbox-gl/dist/mapbox-gl.css`) |
| Markdown | `marked` |
| Drag & Drop | `@dnd-kit/core` |
| 3D Models | `@google/model-viewer` |

Install with `--legacy-peer-deps` for React 19 compatibility.
Read real docs — do NOT invent API methods.

---

## FieldType Enum (Complete)

```
AI_TEXT, AUTO_NUMBER, BARCODE, BUTTON, CHECKBOX, COUNT,
CREATED_BY, CREATED_TIME, CURRENCY, DATE, DATE_TIME, DURATION,
EMAIL, EXTERNAL_SYNC_SOURCE, FORMULA, LAST_MODIFIED_BY,
LAST_MODIFIED_TIME, MULTILINE_TEXT, MULTIPLE_ATTACHMENTS,
MULTIPLE_COLLABORATORS, MULTIPLE_LOOKUP_VALUES,
MULTIPLE_RECORD_LINKS, MULTIPLE_SELECTS, NUMBER, PERCENT,
PHONE_NUMBER, RATING, RICH_TEXT, ROLLUP, SINGLE_COLLABORATOR,
SINGLE_LINE_TEXT, SINGLE_SELECT, URL
```

Always use the enum. Never compare field types against string literals.

---

## Available Hooks & Functions

| Name | From | Purpose |
|------|------|---------|
| `initializeBlock` | `interface/ui` | Register root component |
| `useBase` | `interface/ui` | Access base (tables, schema) |
| `useRecords` | `interface/ui` | Load records (reactive, auto-updates) |
| `useCustomProperties` | `interface/ui` | Define/read configurable properties |
| `useColorScheme` | `interface/ui` | Get `"dark"` or `"light"` |
| `useSession` | `interface/ui` | Get current user (`email`, `id`, `name`, `profilePicUrl`) |
| `expandRecord` | `interface/ui` | Open record detail page |
| `colorUtils.getHexForColor` | `interface/ui` | Convert color name → hex |
| `FieldType` | `interface/models` | Enum for field type comparison |

---

## Dev Commands

```bash
block run --port 9003          # Start dev server
echo "description" | block release   # Release
block set-api-key <PAT>       # Set auth token
```

**Gotcha**: `block run` won't work until you've done at least one `block release`. Always do an initial release first for new extensions.

## Package Dependencies

```json
{
    "@airtable/blocks": "interface-alpha",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
}
```

---

## Production Patterns

### Linked Record Deduplication
```javascript
const driIds = new Set((engDRI || []).map(d => d.id));
const uniqueStaffing = (engStaffing || []).filter(e => !driIds.has(e.id));
```

### Overflow Lists ("Alice, Bob +3")
```javascript
const names = people.slice(0, 3).map(p => p.name?.split(' ')[0]).join(', ');
const overflow = people.length > 3 ? ` +${people.length - 3}` : '';
```

### Grouping with useMemo
```javascript
const grouped = useMemo(() => {
    const groups = {};
    records.forEach(r => {
        const key = safeGetCellValueAsString(r, 'Area') || 'Uncategorized';
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });
    return groups;
}, [records]);
```

### Filter Chips (Multi-Select Toggle)
```javascript
const [active, setActive] = useState(new Set(['A', 'B', 'C']));
const toggle = useCallback((item) => {
    setActive(prev => {
        const next = new Set(prev);
        next.has(item) ? next.delete(item) : next.add(item);
        return next;
    });
}, []);
```

---

## Airtable Metadata API Limitations

| Operation | Works? | Workaround |
|-----------|--------|------------|
| Read schema | Yes | `GET /v0/meta/bases/{id}/tables` |
| Rename field | Yes | PATCH |
| Create field | Yes | POST (most types) |
| Create createdBy/createdTime | **No** (422) | Add in Airtable UI after table creation |
| Delete field | **No** (404) | Rename to `[DELETE]` prefix, delete in Airtable UI |
| Update formula | **No** (422) | Edit in Airtable UI |
| Create table | Yes | POST to `/meta/bases/{id}/tables` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "You can only run your development block in the original base" | Update `baseId` in `block.json` |
| Extension not rendering | Check `initializeBlock({ interface: () => <Component /> })` |
| Import errors | Use `@airtable/blocks/interface/ui`, NOT `@airtable/blocks/ui` |
| Field access crashes | Use `getFieldIfExists()`, never `getField()` |
| `[object Object]` in UI | Use `.name` on select values, or `getCellValueAsString()` |
| Blank names for People/linked records | Use `record.name` (returns primary field value regardless of field name), not `getCellValueAsString('Name')` which assumes the primary field is called "Name" |
| Checkbox comparison fails | Unchecked = `null`, not `false` |
| npm peer dep warnings | Install with `--legacy-peer-deps` |
| Multi-table data not loading | Configure tables in Interface Designer properties panel |

---

## Lessons Learned (from PDC project)

### UI/UX
- Linked record names on cards: CSS `text-overflow: ellipsis` looks bad. Better: show first 3 names + "+N" programmatically.
- Secondary sort by eng count (`staffing.length`) is more useful than percentage — concrete numbers over ratios for leadership views.
- SVG inline icons (Feather-style, 14px, theme-colored) look professional for exec-facing tools. Emojis look unprofessional.
- Heatmap cell shading (type-colored background, opacity = count/max) is better than 3D visualizations for small datasets.

### Data Model
- `multipleLookupValues` and `multipleRecordLinks` both return `[{id, name}]` — same access pattern, same null checks.
- Airtable AI fields don't know "today's date" — must explicitly include the date in the prompt and update the field periodically. Workaround: reference a formula field containing `TODAY()` as an AI field input.
- AI field prompts must be EXPLICIT about date filtering: "CRITICAL: Today is [date]. Only return milestones with dates AFTER today." Without this, AI returns nearest milestone regardless of past/future.
- AI fields tend to prepend phase labels ("DESIGN Dogfood"). Prompt must say "Do not prepend phase labels."
- React `Set` state: must create a new `Set` on each update for React to detect the change (reference equality). `prev.add(x)` mutates in place and won't trigger re-render.

### Records API vs Metadata API
- **Linked records**: Records API wants `["recXXX"]` (array of ID strings). Metadata API uses `{linkedTableId: "tblXXX"}` for field config. Don't mix them up.
- **Single select values**: Records API wants `"Active"` (plain string). Metadata API uses `{choices: [{name: "Active"}]}` for field config.
- **DELETE API**: Max 10 records per call. Batch into groups of 10.
- **Invalid select option colors**: API rejects arbitrary color names. Must use valid Airtable palette names (`orangeBright`, `cyanLight2`, etc.).

### Interface Extension Gotchas (from production)
- `hasPermissionToUpdateRecord()` / `hasPermissionToCreateRecords()` can silently block saves in interface extensions. If saves fail mysteriously, try removing permission gates — the interface's own data source permissions handle access control.
- `|| undefined` breaks checkbox saves: `value || undefined` converts `false` to `undefined`, so unchecking a checkbox never saves. Don't use `||` for boolean field values.
- `useRecords(undefined)` crashes — SDK tries to access `.id` on undefined. Guard with `useRecords(table || null)` pattern. But `useRecords(null)` also crashes — use `useRecords(table || base.tables[0])` then nullify results if table didn't exist.
- People table (or any lookup table) must be exposed in interface data sources. If not enabled, `useRecords(table)` returns empty.
- Custom properties need ALL referenced tables configured in the extension settings panel — not just the primary table.
- Interface extension record editing must be explicitly enabled: in interface designer, enable "Allow record editing" and "Allow record creation" on the data source for each table.
- `block add-remote <baseId/blockId> <remoteName>` — block identifier comes FIRST, then the name. If you already have code, use `add-remote` to link to an existing Builder Hub extension.
- CDN cache after release: Airtable's CDN sometimes takes a minute+ to serve new bundle. Hard refresh (Cmd+Shift+R) or close/reopen tab.
- Release can report success but not propagate if `baseId` is wrong in remote.json. Always verify in Builder Hub after release.
- "No releases yet" in interface after successful release = stale reference. Extension was added before first release existed. Remove and re-add the extension element.

### Architecture Decisions
- Build extensions directly in the target base to avoid migration complexity.
- Custom modal vs `expandRecord()`: custom modal for themed UX, `expandRecord()` for native detail panel with less work. Can offer both with an "Open in Airtable" button.
- Interface Designer is faster for standard CRUD views; custom extensions for full layout/aesthetic control.
- Two-extension architecture for permissions: split into DRI + Leadership extensions rather than email-based permission checking in code. Simpler to maintain, no email list to update.
- Single scrollable page > tabs for landing pages. Tabs + section cards create duplicate nav.
- "?" help button opening a modal (not a dedicated tab) saves nav slots.
- Edit button on cards that switches to editable mode (not editable by default) — "prevents fear of breaking everything."
