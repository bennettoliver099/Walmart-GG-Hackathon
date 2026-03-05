# PROJECT BRIEF — Walmart GG AI Hackathon Portal

> **Purpose of this document:** Written for an AI assistant or engineer joining the project cold. Read top to bottom before writing any code. Update this file after completing any significant work.
>
> **Last updated:** March 2026

---

## 1. PROJECT OVERVIEW

### What It Is
A custom Airtable **Interface Extension** that serves as the event portal for Walmart's FY27 Global Governance (GG) AI Hackathon. It lives inside an Airtable Interface page (not the Extensions panel) and is accessed by all participants through that interface.

### Who It's For
- **Participants** — Walmart Home Office associates who want to register for the hackathon, browse problem statements, and track registered teams.
- **Organizers** — The GG Digital Acceleration team (Bennett Oliver and colleagues) who run the event and manage registrations via the underlying Airtable base.

### The Problem It Solves
The hackathon needed a single self-contained registration and information hub that lives inside Airtable (where all the event data lives anyway), rather than a separate website. It provides:
- A polished, consumer-grade event landing experience
- In-app registration that writes directly to the Hackathon Submissions table
- A live registration portal showing all teams
- Browsable problem statements pulled live from Airtable
- A single source of truth for rules, tools, key dates, and contacts

### Business Context
- **Event:** FY27 GG AI Hackathon — a 48-hour build event
- **Build window:** March 16–19, 2026 (8am CT start)
- **Science Fair (presentations):** March 20, 2026
- **Registration deadline:** March 9, 2026 at 5pm CT
- **Team limit:** 50 teams
- **Approved tools:** Airtable, Harvey (document AI), CodePuppy (code assistant)
- **Judging criteria:** Relevance to GG (30%), Business Impact (25%), AI Integration (25%), Demo Quality (20%)

---

## 2. TECH STACK & ARCHITECTURE

### Repository
- **GitHub:** `https://github.com/bennettoliver099/Walmart-GG-Hackathon`
- **Local path:** `~/Documents/walmart-gg-hackathon/`

### File Structure
```
walmart-gg-hackathon/
├── .block/
│   └── remote.json          # Block ID + baseId (MUST be "NONE" for interface extensions)
├── frontend/
│   ├── index.js             # THE ENTIRE APPLICATION — single file, ~1,100 lines
│   └── style.css            # Empty — all styles are CSS-in-JS inside index.js
├── airtable-sdk-rules.md    # Critical SDK rules — read before writing any Airtable code
├── block.json               # { "version": "1.0", "frontendEntry": "./frontend/index.js" }
├── eslint.config.mjs
├── package.json
├── package-lock.json
└── tailwind.config.js       # Installed but NOT used — CSS-in-JS pattern instead
```

### Key Dependencies
```json
{
  "@airtable/blocks": "interface-alpha",
  "@phosphor-icons/react": "^2.1.10",
  "react": "^19.1.0",
  "react-dom": "^19.1.0"
}
```
- **`@airtable/blocks`** — The Airtable Interface Extension SDK. The `interface-alpha` tag resolves to a specific experimental build. If this ever breaks, check `npm show @airtable/blocks dist-tags` for the correct version.
- **`@phosphor-icons/react`** — All icons. Always use the `Icon` suffix (`ArrowRightIcon`, not `ArrowRight`). Use `weight="duotone"` for card icons.
- **Tailwind** — Installed in devDependencies but not actually used in the app. All styles are a single CSS template literal injected via `<style>{css}</style>`.

### How the Airtable Extension Works

**Block IDs:**
- Block ID: `blkzCkwUXlikfqF3Y`
- Base ID in `.block/remote.json`: `"NONE"` — this is required for interface extensions (NOT the real base ID)
- App/Base ID: `app4AdZ5m3rWZ4kt8` (used in the external form URL)

**Entry point — CRITICAL:**
```javascript
initializeBlock({ interface: () => <App /> });
// The { interface: ... } wrapper is REQUIRED. Without it, nothing renders.
// This is different from dashboard/base extensions which use: initializeBlock(() => <App />)
```

**Import path — CRITICAL:**
```javascript
import { initializeBlock, useBase, useRecords } from '@airtable/blocks/interface/ui';
// NEVER import from '@airtable/blocks/ui' — that's for base extensions, will fail silently
```

**Data flow:**
```
useBase() → tables → useRecords(table) → records[]
```
All data is reactive — `useRecords()` re-renders the component when records change in Airtable.

**Dev workflow:**
```bash
cd ~/Documents/walmart-gg-hackathon
block run          # Starts dev server on https://localhost:9000
# Then in Airtable: Interface → Edit → custom extension → "Run local development extension"
```

**Release:**
```bash
echo "your release note" | block release
# If it prompts interactively:
expect -c 'spawn block release; expect "comment"; send "your note\r"; expect eof'
```

### Architecture Constraints
- **Single file** — The entire app lives in `frontend/index.js`. No component files, no separate CSS files, no routing library.
- **No external fetch** — No `fetch()` calls to external APIs. All data comes from Airtable hooks.
- **No Airtable UI components** — `Box`, `Button`, `Input`, etc. from the SDK are NOT available in interface extensions. Everything is hand-rolled HTML/CSS.
- **CSS-in-JS only** — The entire stylesheet is a template literal (`const css = \`...\``) injected as `<style>{css}</style>` in the root render. Class names are plain strings.
- **No TypeScript** — Plain JavaScript/JSX throughout.

---

## 3. DESIGN SYSTEM

### Design Tokens (`T` object)
All colors, shadows, and gradients are stored in a single `T` object at the top of `index.js`. **Never hardcode hex values inline — always reference `T.*`.**

```javascript
const T = {
    blue:     '#0071CE',   // Walmart blue — primary action color, links, active states
    deep:     '#001E60',   // Walmart navy — headings, hero background start, dark footer
    azure:    '#2C8EF4',   // Mid blue — hero gradient midpoint
    ice:      '#E8F2FF',   // Light blue tint — selected states, callout backgrounds
    cloud:    '#F5F5F5',   // Neutral light gray — alternating section backgrounds
    white:    '#FFFFFF',   // Pure white — card backgrounds, modal backgrounds
    yellow:   '#FFC220',   // Walmart yellow — primary CTA buttons, active phase pills
    body:     '#2B2B2B',   // Near-black — body text
    muted:    '#6B6B6B',   // Medium gray — secondary text, subtitles
    muted2:   '#9B9B9B',   // Light gray — tertiary text, timestamps, disabled states
    border:   '#E5E5E5',   // Neutral border — card borders, table rows, dividers
    border2:  '#C5D6EC',   // Blue-tinted border — focus rings, callout borders, hover states
    heroGrad: 'linear-gradient(135deg,#001E60 0%,#0071CE 65%,#2C8EF4 100%)',
    shadow:   '0 1px 4px rgba(0,0,0,0.07)',    // Subtle — stat items
    shadowM:  '0 6px 24px rgba(0,0,0,0.10)',   // Card hover
    shadowL:  '0 12px 40px rgba(0,0,0,0.13)',  // Modals
};
```

### Typography
- **Primary font stack:** `'Bogle', 'Brandon Text', 'Inter', sans-serif`
  - Bogle and Brandon Text are Walmart brand fonts — may not render outside Walmart network. Inter (loaded from Google Fonts) is the reliable fallback.
- **UI/label font:** `'Inter', sans-serif` (most nav, labels, metadata)
- **Hero h1:** 42px, weight 800, `T.yellow` color with a gradient `.accent` span
- **Section h2 (`.sec-h2`):** 26px, weight 800, `T.deep`
- **Card titles:** 14–17px, weight 700–800, `T.deep`
- **Body text:** 13–14px, `T.body`
- **Labels/metadata:** 10–11px, `T.muted`, often uppercase with letter-spacing

### Layout Architecture
The app is a fixed `height: 100vh` flex column:
```
.portal (flex column, height: 100vh, overflow: hidden)
├── .portal-header (flex-shrink: 0) — everything above tabs
│   ├── .hero — gradient hero with orbital animation
│   ├── .stat-bar — 6-column live stats
│   ├── .phase-section — 4-step phase timeline
│   └── .tab-bar — 5 tab buttons
└── .portal-body (flex: 1, overflow-y: auto) — scrollable tab content
```

### Section Pattern (Tab Content)
Each tab uses alternating `sec-cloud` / `sec-white` sections, each containing a `sec-wrap`:
```jsx
<div className="sec-cloud">
    <div className="sec-wrap">          // max-width: 1200px, padding: 48px 56px
        <span className="sec-label">   // 10px, uppercase, T.blue, letter-spacing 0.2em
        <h2 className="sec-h2">        // 26px, weight 800, T.deep
        <p className="sec-sub">        // 14px, T.muted, max-width 640px
        {/* content */}
    </div>
</div>
```

### Card Patterns
All cards follow: white background, `T.border` border (1px solid), 8px border-radius, hover → `shadowM` + `border2`.

| Card type | CSS class | Grid |
|-----------|-----------|------|
| Rule cards | `.rule-card` | 3-col |
| Tool cards | `.tool-card` | 3-col + top color bar |
| Problem cards | `.prob-card` | 3-col + left diff color bar |
| Judge/scoring cards | `.judge-card` | 4-col |
| Help cards | `.help-card` | 3-col |
| Team cards | `.team-card` | 3-col |

### Button Patterns
- `.btn-primary` — Yellow fill (`T.yellow`), `T.deep` text — primary CTA
- `.btn-outline` — Semi-transparent white, white text — secondary on dark backgrounds
- `.btn-outline-dark` — Transparent, `T.deep` text, `border2` border — secondary on light backgrounds
- `.topbar-cta` — Yellow, compact — nav-level CTA
- `.submit-btn` — Yellow, inside modals
- `.cancel-btn` — Text only, `T.muted`

### Orbital Animation (Hero)
CSS-only animation using `@keyframes lpspin`. Three concentric rings (`.orb-r1/r2/r3`) at different speeds. Two orbiting tracks (`.orb-t1/t2`) with dot children (yellow + white) at different radii and rotation speeds. Center core (`.orb-core`) has backdrop-filter blur.

---

## 4. AIRTABLE BASE STRUCTURE

**Base ID:** `app4AdZ5m3rWZ4kt8`

Field lookup pattern used throughout: `table.getFieldIfExists('Field Name')` — returns `null` if field doesn't exist. All field access is wrapped in try/catch or null-checked.

---

### Table: `Hackathon Submissions`
Primary table — **written to** by the registration form.

| Field Name | Type | Read/Write | Notes |
|------------|------|------------|-------|
| `Team Name` | Single line text | Write | Required for team reg. Free agents write `"Free Agent Pool"`. Filtered against `TEST_NAMES` in UI. |
| `Use Case` | Long text | Write | Team's project description. Optional for free agents. Shown in TeamDetailModal. |
| `Technology` | Single select | Write | Options: `Airtable`, `CodePuppy`, `Harvey`, `Other` |
| `Other Technology` | Single line text | Write | Written only when `Technology === 'Other'` |
| `Attendance Format` | Single select | Write | Options: `Virtual`, `In Person`, `Hybrid` |
| `Submission Status` | Single select | Write | Options: `Registered`, `Free Agent`, `Submitted`. Used to filter team lists. |
| `Team Member # 1 ( Captain)` | Linked record → GG Directory | Write | Note the space before the closing paren — exact field name required. Index 0 in `memberFields` array. |
| `Team Member # 2` | Linked record → GG Directory | Write | Index 1 |
| `Team Member # 3` | Linked record → GG Directory | Write | Index 2 |
| `Team Member # 4` | Linked record → GG Directory | Write | Index 3 |
| `Team Member # 5` | Linked record → GG Directory | Write | Index 4 |
| `By Selecting the checkbox, you attest that you have read the rules linked above and agree that your team will follow them.` | Checkbox | Write | Full field name used as the key. Written as `true`. |
| `Link To Hackathon Rules & Guidelines` | URL | Write | Written with value of `RULES_URL` constant. |
| `AI Skill Level` | Number | Write | 1–5. Parsed with `parseInt(value, 10)`. |
| `Problem Interest` | Long text | Write | Free agents only. |

**Field refs in code:**
```javascript
const sfTeamName = subTable.getFieldIfExists('Team Name');
const sfStatus   = subTable.getFieldIfExists('Submission Status');
const sfUseCase  = subTable.getFieldIfExists('Use Case');
const sfMember1  = subTable.getFieldIfExists('Team Member # 1 ( Captain)');
const sfMember2  = subTable.getFieldIfExists('Team Member # 2');
// ... sfMember3, sfMember4, sfMember5
const memberFields = [sfMember1, sfMember2, sfMember3, sfMember4, sfMember5];
```

**Derived stats computed from this table:**
- `liveTeams` — all records where `Submission Status !== 'Free Agent'` and `Team Name` not in `TEST_NAMES`
- `freeAgents` — all records where `Submission Status === 'Free Agent'`
- `submittedTeams` — count where `Submission Status === 'Submitted'`
- `spotsLeft` — `Math.max(0, 50 - liveTeams.length)`

---

### Table: `Problem Statements`
**Read-only** in the extension. Displayed as cards in the Challenges tab.

| Field Name (primary) | Fallback name | Type | Notes |
|----------------------|---------------|------|-------|
| `Problem ID` | — | Text | Short identifier shown in card top-left |
| `Name` | `Problem` | Text | Card title |
| `Description` | `Current State` | Long text | Truncated to 130 chars in card preview |
| `Difficulty` | — | Single select | Options: `Easy` / `Medium` / `Hard`. Controls left color bar: green/orange/red |
| `Impact` | — | Single select | `High` shows a blue "High Impact" badge |
| `Domain` | `Category` | Text or select | Shown as gray tag |
| `Claimed By` | `Teams Exploring` | Linked record or text | Displayed in ProblemDetailModal |

**Field refs in code:**
```javascript
const pfId      = probTable.getFieldIfExists('Problem ID');
const pfTitle   = probTable.getFieldIfExists('Name') ?? probTable.getFieldIfExists('Problem');
const pfDesc    = probTable.getFieldIfExists('Description') ?? probTable.getFieldIfExists('Current State');
const pfDiff    = probTable.getFieldIfExists('Difficulty');
const pfImpact  = probTable.getFieldIfExists('Impact');
const pfDomain  = probTable.getFieldIfExists('Domain') ?? probTable.getFieldIfExists('Category');
const pfClaimed = probTable.getFieldIfExists('Claimed By') ?? probTable.getFieldIfExists('Teams Exploring');
```

---

### Table: `GG Directory`
**Read-only.** Used by `MemberSearch` component to let users find and select teammates by name or email.

| Field Name (primary) | Fallback name | Type |
|----------------------|---------------|------|
| `Name` | `Associate Name` | Text |
| `Email` | `Work Email` | Text |

**Field refs in code:**
```javascript
const dfName  = dirTable.getFieldIfExists('Name') ?? dirTable.getFieldIfExists('Associate Name');
const dfEmail = dirTable.getFieldIfExists('Email') ?? dirTable.getFieldIfExists('Work Email');
```

---

### Table: `Prompt Library`
`useRecords()` is called and assigned to `prmRecords` — **not currently used in any UI component.** Reserved for future use.

---

### Table: `Regulatory Documents`
`useRecords()` is called and assigned to `regDocs` — **not currently used in any UI component.** Reserved for future use.

> **Note:** `useRecords()` must always receive a non-null table. All tables fall back to `base.tables[0]` if not found: `const subTable = base.getTableByNameIfExists('Hackathon Submissions') ?? base.tables[0]`. If a table fallback fires, `prmRecords` and `regDocs` will reflect `base.tables[0]` data — this is harmless since they're not rendered.

---

## 5. CURRENT STATE OF THE BUILD

### Fully Working

| Feature | Location | Notes |
|---------|----------|-------|
| Hero section | `App` render | Gradient bg, orbital animation, h1, byline, two CTA buttons |
| Live stat bar | `App` render | 6 columns: Teams, Submitted, Free Agents, Problems, Spots Left, Countdown |
| Live countdown timer | `App` + `useEffect` | Updates every 1000ms via `setInterval` |
| Phase timeline | `App` render | 4 pills: Register (active), Train, Build, Present |
| Tab navigation | `TABS` constant + `tab` state | 5 tabs, no URL routing |
| **Rules & Guidelines tab** | `tab === 'rules'` | Rule cards, key dates table, scoring rubric (always visible) |
| **Register tab** | `tab === 'register'` | Two-column: Team Registration + Free Agent, both open `RegistrationModal` |
| **Registration Portal tab** | `tab === 'teams'` | Live team grid, portal stat strip, empty state |
| **Challenges & Tools tab** | `tab === 'challenges'` | Callout, problem cards (live), tool cards (static) |
| **Help tab** | `tab === 'help'` | FAQ accordion, 3 contact blocks, mentor program card |
| `RegistrationModal` | Component | Full 3-screen flow: option picker → team form OR free agent form → success |
| Team registration form | Inside `RegistrationModal` | Team name, use case, tech, attendance, skill level, 5 member searches, rules agreement |
| Free agent form | Inside `RegistrationModal` | Self-search, interest, tool, attendance, skill, agreement |
| Form validation | `validateTeam()` / `validateAgent()` | Field-level error display |
| Airtable write | `handleTeamSubmit()` / `handleAgentSubmit()` | Per-field try/catch, writes only fields that exist |
| `createRecordWithRetry` | Utility function | Exponential backoff (200ms × 2^i) on conflict errors, 3 attempts |
| External form fallback | `ExternalFallback` | Shows link to external Airtable form if write permission denied |
| `MemberSearch` component | Component | Live search GG Directory by name or email, 8-result limit |
| Post-registration redirect | `handleModalClose` | On success → auto-switches to `teams` tab via `justRegistered` state |
| `ProblemDetailModal` | Component | Full problem description, tags, "being explored by", note about multiple teams |
| `TeamDetailModal` | Component | Team name, status badge, member list with Captain badge, use case, workspace button |
| Test record filter | `TEST_NAMES` constant | Filters: `['Test', 'Test ', 'Test2', 'test 5', 'Rest']` |
| Problem cards | `renderProbCard()` | Left difficulty color bar, tags, truncated description, click to expand |

### Stubbed / Coming Soon

| Feature | Location | State |
|---------|----------|-------|
| Team Workspace button | `TeamDetailModal` | Grayed-out button: `<button className="ws-coming-soon" disabled>Coming Soon</button>` |
| "Find a Team" option | `RegistrationModal` screen 0 | Card rendered with `.opt-card-dis` class (pointer-events: none, opacity 0.35) |
| Prompt Library display | App | Data loaded (`prmRecords`) but never rendered |
| Regulatory Documents display | App | Data loaded (`regDocs`) but never rendered |

### Not Yet Built

| Feature | Notes |
|---------|-------|
| **Team Workspace extension** | Agreed to be a separate Interface Extension. Currently referenced only as a disabled button and a note in the Help tab. |
| User identity / "my team" detection | No `useSession()` call. Anyone can click any team card. Cannot detect which team the current viewer is on. |
| Problem claiming | Problems are read-only. No UI to claim/unclaim a problem from this extension. |
| Free agent matching UI | Matching is done manually by organizers. No UI for this. |
| Submission / final project upload | No submission flow built. |
| Search / filter on Registration Portal | Team grid shows all teams with no filtering. |

---

## 6. INTERFACE PAGES

This is a **single Airtable Interface page** containing one custom extension. There is no multi-page routing within the extension — all navigation is tab-based state (`useState`).

### Extension 1: GG Hackathon Portal (THIS FILE)
**URL context:** Lives inside an Airtable Interface at `app4AdZ5m3rWZ4kt8`

| Tab | `tab` value | Purpose |
|-----|-------------|---------|
| Rules & Guidelines | `'rules'` | Entry point (default). Rule cards, key dates table, scoring rubric. |
| Register | `'register'` | Two registration paths. Opens `RegistrationModal`. After success, redirects to Teams tab. |
| Registration Portal | `'teams'` | Live grid of all registered teams. Click any team for `TeamDetailModal`. |
| Challenges & Tools | `'challenges'` | Problem statement cards (live from Airtable) + static tool cards. "See the Challenges" hero button deep-links here. |
| Help | `'help'` | FAQ accordion, contact blocks (Bennett/Abby/Michael), mentor program info. |

### Extension 2: GG Hackathon Workspace (NOT YET BUILT)
Planned as a separate Airtable Interface Extension. Intended content:
- Training calendar
- Resource library
- Team announcements
- Submission checklist
- Team notes / scratchpad
- Mentor contact info

Currently surfaced to users only as: a "Coming Soon" disabled button in `TeamDetailModal` and a note in the Mentor help card: *"Available in the GG Hackathon Workspace extension."*

---

## 7. OPEN DECISIONS & UNRESOLVED QUESTIONS

| Question | Context | Status |
|----------|---------|--------|
| **User identity for "my team"** | `useSession()` is available and returns `{ email, id, name }`. Could compare session email against linked record member emails to highlight or gate the user's own team card. Not implemented. | Unresolved |
| **Team Workspace access gating** | When the Workspace extension is built, should it show all teams or only the current user's team? | Unresolved |
| **Problem claiming** | Can teams stake a claim on a problem from the UI? Currently read-only. Would require write permission on the Problem Statements table and a `Claimed By` field update. | Unresolved |
| **Free agent matching flow** | Is there a self-service matching UI, or does the organizer manually reassign free agent records in Airtable? Currently manual. | Unresolved |
| **Registration Portal visibility** | Should unregistered viewers see all team names and members, or is that a privacy concern? Currently fully public within the interface. | Unresolved |
| **Submission Status transitions** | Who/what changes `Submission Status` from `Registered` to `Submitted`? No submission UI exists yet. | Unresolved |
| **Prompt Library and Regulatory Documents** | These tables are loaded but unused. Are they intended for a future tab, or the Workspace extension? | Unresolved |
| **`useCustomProperties` adoption** | The `airtable-sdk-rules.md` recommends using `useCustomProperties` so table/field mappings are configurable without code changes. Currently all field names are hardcoded. | Technical debt |
| **Harvey / CodePuppy license provisioning** | The UI tells users to contact Abby Worley or Michael. No automated provisioning or confirmation flow exists. | Operational |

---

## 8. CONSTANTS & CONFIGURATION

All hardcoded values live at the top of `frontend/index.js`:

```javascript
const EXTERNAL_FORM_URL  = 'https://airtable.com/app4AdZ5m3rWZ4kt8/pagX2wubHXk1Q7Em0/form';
// Fallback form shown when Airtable write permissions are denied

const RULES_URL          = 'https://teams.wal-mart.com/sites/GGDigitalAcceleration';
// Walmart internal Teams site — may require VPN or Walmart network access

const TEST_NAMES         = ['Test', 'Test ', 'Test2', 'test 5', 'Rest'];
// Records with these exact Team Name values are excluded from all stat counts and team displays

const TECH_OPTIONS       = ['Airtable', 'CodePuppy', 'Harvey', 'Other'];
// Registration form radio options. 'Other' reveals a free-text input.

const ATTENDANCE_OPTIONS = ['Virtual', 'In Person', 'Hybrid'];
// Registration form radio options.

const HACKATHON_DEADLINE = new Date('2026-03-09T17:00:00');
// Used for live countdown timer. Local time (CT assumed).

const MAX_TEAMS          = 50;
// Hard cap on team registrations. Used in stat bar (Spots Remaining) and registration copy.
```

**Key dates (static array — update as event details change):**
```javascript
const KEY_DATES = [
    { event: 'Free Agent Matching Closes',   date: 'March 8',              note: '' },
    { event: 'Registration Closes',          date: 'March 9 · 5pm CT',     note: '50-team limit' },
    { event: 'Final Team Changes',           date: 'March 14',             note: '' },
    { event: 'Build Window Opens',           date: 'March 16 · 8am CT',    note: 'No building before this date' },
    { event: 'Build Window Closes',          date: 'March 19 · 5pm CT',    note: '' },
    { event: 'Science Fair (Presentations)', date: 'March 20',             note: 'Bentonville & Virtual' },
];
```

**Phase timeline (static — update `active` flag as the event progresses):**
```javascript
const PHASES = [
    { label: 'Register', sub: 'Now Open — March 9',     active: true  },
    { label: 'Train',    sub: 'Week of March 9',          active: false },
    { label: 'Build',    sub: 'March 16–19 · 48 hrs',    active: false },
    { label: 'Present',  sub: 'March 20 · Science Fair', active: false },
];
// Change active: true to the current phase as the event progresses.
```

**Tab configuration:**
```javascript
const TABS = [
    ['rules',      'Rules & Guidelines'],
    ['register',   'Register'],
    ['teams',      'Registration Portal'],
    ['challenges', 'Challenges & Tools'],
    ['help',       'Help'],
];
```

---

## 9. KNOWN CONSTRAINTS & GOTCHAS

### Airtable SDK (Interface Extension)

| Issue | Detail |
|-------|--------|
| **`baseId` must be `"NONE"`** | In `.block/remote.json`. If set to the real base ID, you get "You can only run in original base" error. |
| **Import path is everything** | Use `@airtable/blocks/interface/ui`. Using `@airtable/blocks/ui` compiles but nothing works. |
| **`initializeBlock` syntax** | Must be `initializeBlock({ interface: () => <App /> })`. Not `initializeBlock(() => <App />)`. |
| **`getFieldIfExists()` only** | Never `getField()`, `getFieldByName()`, or `getFieldById()`. They throw. |
| **`useRecords(null)` crashes** | The SDK tries to access `.id` on null. Always fall back: `base.getTableByNameIfExists('X') ?? base.tables[0]`. |
| **Checkbox `null` ≠ `false`** | Unchecked checkbox fields return `null`, not `false`. Don't use `value || undefined` for boolean saves — it converts `false` to `undefined`. |
| **No native UI components** | `Box`, `Button`, `Input`, `Text` etc. from the Airtable SDK are not available. Build everything in HTML/CSS. |
| **50 records per API call** | `createRecordAsync` processes one at a time. For bulk operations, batch into groups of 50. |
| **Rate limit: 15 calls/sec** | Respect this for any bulk write operations. |
| **CDN cache after release** | New releases can take 1–2 minutes to propagate. Hard refresh (Cmd+Shift+R) or close/reopen tab. |
| **First release required** | `block run` won't work until at least one `block release` has been done. |
| **`block release` prompt** | Newer SDK versions prompt for a release comment interactively. Use `expect` to automate, or just type it. |
| **Tables must be exposed** | Tables must be added as data sources in the Interface Designer settings panel. If `useRecords()` returns empty for a table that has records, check data source configuration. |
| **Record editing must be enabled** | Interface Designer → data source settings → enable "Allow record editing" and "Allow record creation" for the Submissions table. |

### Write Permission Handling
The app wraps every `fields[f.id] = ...` assignment in an individual try/catch. If any field doesn't exist in the base, it's silently skipped. If the Airtable write permission is denied (interface not configured for record creation), the error message is checked for "permission"/"not authorized"/"read only" keywords and shows the `ExternalFallback` component with a link to the external form.

### Walmart Network
- `RULES_URL` points to `teams.wal-mart.com` — Walmart's internal Teams site. May require Walmart VPN or corporate network to access.
- The external form URL (`airtable.com/app4AdZ5m3rWZ4kt8/...`) is a public Airtable form.

### PAT Storage
The personal access token is stored at `~/.config/.airtableblocksrc.json` via `block set-api-key`. Required scopes: `block:manage`, `schema.bases:read`, `data.records:read`, `data.records:write`.

---

## 10. NEXT PRIORITIES

In order of importance:

### 1. Team Workspace Extension (new Airtable Interface Extension)
Build a second extension for post-registration content. Users currently see a grayed-out "Coming Soon" button in the `TeamDetailModal`. The new extension should include:
- Training calendar / office hours schedule
- Resource library (rules doc, templates, tool guides)
- Team announcements feed
- Submission checklist with checkboxes
- Team notes (shared scratchpad, writes to Airtable)
- Mentor contact info

Set up as a new `block init NONE/blkXXX` project in a separate directory. The Workspace extension will need its own block registration in Airtable Builder Hub.

### 2. User Identity — "My Team" Highlighting
Add `useSession()` to get the current viewer's email and name. Use this to:
- Highlight the current user's team card in the Registration Portal (e.g., border color change, "Your Team" badge)
- Potentially enable team-specific actions (edit use case, add/remove members within deadline)

```javascript
import { useSession } from '@airtable/blocks/interface/ui';
const session = useSession();
// session.currentUser.email, session.currentUser.name
```

Cross-reference `session.currentUser.name` against member linked record names in `liveTeams`.

### 3. Registration Portal — Search & Filter
The team grid currently shows all teams with no way to filter. As registrations grow toward 50 teams, add:
- A text search input filtering by team name or member name
- Filter chips for `Attendance Format` (Virtual / In Person / Hybrid)
- Filter chip for `Technology` (Airtable / Harvey / CodePuppy)

### 4. Phase Timeline — Dynamic Active State
The `PHASES` array has `active` hardcoded. As the event progresses through phases, the currently active pill needs to update. Either:
- Manually update the `active` flag in the code before each phase
- Or derive it dynamically from `new Date()` compared to `KEY_DATES` constants

### 5. Problem Claiming / Interest Tracking
Allow teams to "stake interest" in a problem statement by writing their team name to the `Claimed By` / `Teams Exploring` field in the Problem Statements table. Currently all problem data is read-only. This would need:
- Write permission on the Problem Statements table in Interface Designer
- A "I'm interested in this problem" button in `ProblemDetailModal`
- Append logic (not overwrite) since multiple teams can explore the same problem

---

## APPENDIX — Component Reference

| Component | Type | Purpose |
|-----------|------|---------|
| `SparkIcon` | Function component | Inline SVG Walmart spark logo. Props: `size`, `color`. |
| `ProblemDetailModal` | Function component | Expanded problem view. Props: `prob`, `onClose`, all `pf*` field refs. |
| `TeamDetailModal` | Function component | Team detail with member list + Coming Soon workspace btn. Props: `team`, `onClose`, `sfTeamName`, `sfStatus`, `sfUseCase`, `memberFields`. |
| `MemberSearch` | Function component | Live search input for GG Directory. Props: `label`, `optional`, `dirRecords`, `nameField`, `emailField`, `selected`, `onSelect`. |
| `RegistrationModal` | Function component | Full 3-screen registration flow. Props: `onClose`, `onRegister`, `submissionsTable`, `dirRecords`, `dirNameField`, `dirEmailField`, `initialScreen`. |
| `createRecordWithRetry` | Async utility | Wraps `table.createRecordAsync` with exponential backoff on conflict errors. |
| `getCountdown` | Utility function | Returns formatted string `"Xd Yh Zm"` or `"Closed"` based on `HACKATHON_DEADLINE`. |
| `App` | Root component | Owns all state, all Airtable hooks, all render logic. |

| State variable | Initial value | Purpose |
|----------------|---------------|---------|
| `tab` | `'rules'` | Active tab |
| `showReg` | `false` | Whether `RegistrationModal` is open |
| `modalInitScreen` | `0` | Which screen modal opens to (0 = picker, 'freeagent' → 'agent') |
| `selProb` | `null` | Currently selected problem record (drives `ProblemDetailModal`) |
| `selTeam` | `null` | Currently selected team record (drives `TeamDetailModal`) |
| `justRegistered` | `false` | Set to `true` by `onRegister`. On modal close, if true → switch to teams tab |
| `openFaq` | `null` | Index of open FAQ item |
| `countdown` | `getCountdown()` | Live countdown string, updated via `setInterval` |
