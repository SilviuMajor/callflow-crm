
## Plan: Add LinkedIn & Twitter Social Link Fields

### What's changing

4 targeted edits across 4 files + 1 new migration. No new files needed (SocialLinkButton is a local component at the bottom of ContactCard.tsx).

---

### Change 1 — Database migration
New file: `supabase/migrations/TIMESTAMP_social_fields.sql`
```sql
alter table contacts add column if not exists linkedin_url text null;
alter table contacts add column if not exists twitter_url text null;
```

---

### Change 2 — `src/types/contact.ts`
Add after `website` in the `Contact` interface:
```ts
linkedinUrl?: string;
twitterUrl?: string;
```

---

### Change 3 — `src/hooks/useContacts.ts`

Three locations to update:

**a) Initial load map (lines ~68-88)** — add after `website: row.website || ''`:
```ts
linkedinUrl: row.linkedin_url || '',
twitterUrl: row.twitter_url || '',
```

**b) Realtime `mapDbRowToContact` (lines ~134-154)** — same addition after `website`:
```ts
linkedinUrl: row.linkedin_url || '',
twitterUrl: row.twitter_url || '',
```

**c) `updateContact` field map (lines ~344-355)** — add after `website` line:
```ts
if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl || null;
if (updates.twitterUrl !== undefined) dbUpdates.twitter_url = updates.twitterUrl || null;
```

**d) `importContacts` insert object (lines ~497-510)** — add after `website`:
```ts
linkedin_url: contact.linkedinUrl || null,
twitter_url: contact.twitterUrl || null,
```

**e) `importContacts` mapped result (lines ~524-538)** — add after `website`:
```ts
linkedinUrl: row.linkedin_url || '',
twitterUrl: row.twitter_url || '',
```

**f) `addContact` insert object (lines ~426-438)** — add after `website`:
```ts
linkedin_url: contact.linkedinUrl || null,
twitter_url: contact.twitterUrl || null,
```

**g) `addContact` result map (lines ~449-464)** — add after `website`:
```ts
linkedinUrl: data.linkedin_url || '',
twitterUrl: data.twitter_url || '',
```

---

### Change 4 — `src/components/ContactCard.tsx`

**a) Desktop layout** — insert Social Links row after line 499 (closing `</div>` of the website block, before the `{/* Company Custom Fields */}` comment):
```tsx
{/* Social Links */}
<div className="flex items-center gap-2 mt-1">
  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Social:</span>
  <div className="flex items-center gap-1.5">
    <SocialLinkButton value={contact.linkedinUrl || ''} label="LinkedIn" icon="linkedin"
      onSave={(value) => onUpdate?.({ linkedinUrl: value })} placeholder="https://linkedin.com/in/..." />
    <SocialLinkButton value={contact.twitterUrl || ''} label="X / Twitter" icon="twitter"
      onSave={(value) => onUpdate?.({ twitterUrl: value })} placeholder="https://x.com/..." />
  </div>
</div>
```

**b) Mobile layout** — insert the same Social Links row after line 853 (closing `</div>` of the second website block, before `{/* Company Summary */}`).

**c) Add `SocialLinkButton` local component** — insert before the final `}` at line 1266, after the `AlertDialog` closing. It uses only React `useState` (already imported) and inline SVG — no new imports needed.

---

### TypeScript safety
- `row.linkedin_url` and `row.twitter_url` come from `any`-typed Supabase rows — no type errors
- `dbUpdates` is typed as `Record<string, any>` — safe to add new keys
- `SocialLinkButton` props interface is fully typed inline
- `contact.linkedinUrl` is `string | undefined`, accessed with `|| ''` throughout

No new imports required. Zero external dependencies added.
