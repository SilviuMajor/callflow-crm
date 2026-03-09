

## Plan: 4 Changes (CSV Import Improvements, Duplicate Detection, Daily Call Target)

### Change 1: Auto-match only exact matches (`ImportCSVModal.tsx`)

In `autoMatchColumn` (lines 52-70), change the logic so that any match that isn't `normalized === aliases[0]` returns `{ targetField: 'skip', confidence: 'none' }` instead of medium confidence. Same for custom fields — only exact label match returns high, everything else skips.

### Change 2: Prevent duplicate field mapping (`ImportCSVModal.tsx`)

In the mapping step's `<Select>` (lines 428-454), compute a `usedFields` set from `mappings` (all `targetField` values excluding `'skip'` and `'create_new'`). For each row's `<SelectItem>`, disable it if its value is in `usedFields` AND it's not the current row's mapping.

### Change 3: Duplicate contact detection (`useContacts.ts` + `ImportCSVModal.tsx` + `CallingPage.tsx`)

- In `importContacts` (lines 469-520 of `useContacts.ts`): Before inserting, check existing `contacts` state for email/phone matches. Split into `toInsert` and `skipped`. Only insert `toInsert`. Return `{ imported: number; skipped: number }`. Remove the `toast.success` call.
- In `ImportCSVModal.tsx` `handleImport` (lines 280-287): Update `onImport` prop type to return `Promise<{ imported: number; skipped: number }>`. Show appropriate toast based on result.
- In `CallingPage.tsx` `handleImportContacts` (line 214-217): Update to match new return type (just ignore returned value).

### Change 4: Configurable daily call target (DB migration + new hook + Settings + CallingPage)

- **Migration**: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS daily_call_target INTEGER NOT NULL DEFAULT 50;`
- **New hook** `src/hooks/useOrganizationSettings.ts`: Reads `daily_call_target` from `organizations` table using org ID from `useAuth()`. Exposes `{ dailyCallTarget, updateDailyCallTarget, isLoading }`.
- **SettingsPage.tsx**: Import hook, add "Daily Call Target" section at top of Layout tab with number input + 500ms debounce.
- **CallingPage.tsx**: Import hook, pass `dailyTarget={dailyCallTarget}` to both QueueList instances.

### Build error fixes (included)

- `create-admin-user/index.ts` line 200: Cast `error` to `Error` → `(error as Error).message`
- `CallingPage.tsx` lines 180/194/199: Fix `toast()` calls that use object syntax — change to `toast.success()` with string args (these are the existing TS errors about `title`).

### Files to create
| File | Purpose |
|------|---------|
| `src/hooks/useOrganizationSettings.ts` | Read/update daily_call_target |

### Files to modify
| File | Changes |
|------|---------|
| `src/components/ImportCSVModal.tsx` | Changes 1, 2, 3 (auto-match, duplicate mapping, import result handling) |
| `src/hooks/useContacts.ts` | Change 3 (duplicate detection, new return type) |
| `src/pages/CallingPage.tsx` | Change 3 (match new return type) + Change 4 (pass dailyTarget) + fix toast TS errors |
| `src/pages/SettingsPage.tsx` | Change 4 (daily target UI in Layout tab) |
| `supabase/functions/create-admin-user/index.ts` | Fix `error` type cast |

### Database migration
```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS daily_call_target INTEGER NOT NULL DEFAULT 50;
```

