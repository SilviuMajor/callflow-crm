
## Plan: ContactCard Layout Restructure

### Current structure (lines 1396–1475)
The `return` block renders:
1. Callback banner (standalone)
2. `sectionOrder.map()` → calls `sectionRenderers[sectionKey]()` for each section in configured order
3. Auto-generate progress indicator
4. Danger Zone collapsible
5. Delete confirm dialog

### New structure
```text
<div>
  ① HERO HEADER (callback banner + name + title/company + ACTION BAR)
  ② HISTORY STRIP (ContactHistoryBar)
  ③ TABS (Script | Research | Details)
  Auto-generate progress
  Danger Zone
  Delete dialog
</div>
```

---

### Changes breakdown

**1. Add Tabs import** (line 26 area)
Add `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';`

**2. State cleanup** (lines 52–55)
- Remove `emailPopoverOpenMobile` (line 53)
- Remove `emailOpenedMobile` (line 55)

**3. Replace the return block** (lines 1396–1475)
Replace the entire `return (...)` with the new Hero + History + Tabs structure. Key points:
- Hero header: callback banner, name (with inline editing wired to existing `startEditing`/`saveField`), job title + company subtitle, then the action bar
- Action bar: phone `<a href="tel:...">`, Send Email popover (single, using existing `emailPopoverOpen`/`emailOpened`/`selectedTemplate` state), separator, SocialLinkButton components, website link
- History strip: `<ContactHistoryBar contactId={contact.id} />`
- Tabs with defaultValue="script":
  - **Script tab**: `{renderAIScript()}` + `{renderStaticScript()}`
  - **Research tab**: company AIResearchBox (company summary) + `{renderPersona()}` + `{renderTargetedResearch()}`
  - **Details tab**: `{renderContactInfo()}` (stripped of phone/email/send-email)
- Auto-generate progress below tabs
- Danger Zone + delete dialog unchanged

**4. Remove `sectionRenderers` map and `sectionOrder.map()` call** (lines 1387–1412)
These are replaced by direct calls inside tabs.

**5. Update `renderContactInfo`** 
Remove from `renderContactInfo`:
- The Phone row (lines 731–761 in desktop, ~1114–1144 in mobile)
- The Email row with Send Email popovers (lines 763–848 in desktop, ~1146–1232 in mobile)
These are now in the action bar.

Keep in `renderContactInfo` (Details tab):
- Company name, website, social links, company custom fields, company summary
- Contact name, job title, contact custom fields, linked contacts

**6. Remove mobile-specific email popover state usage**
- Remove references to `emailPopoverOpenMobile` and `emailOpenedMobile` from `renderContactInfo`'s mobile section

---

### Hero action bar — email popover
The new action bar uses a single `emailPopoverOpen`/`emailOpened`/`selectedTemplate` state (already exists). The popover JSX is identical to the desktop version currently in `renderContactInfo`. The `handleOpenEmailTemplate` and `handleLogEmail` helpers remain unchanged.

---

### What is NOT changed
- All hooks and state declarations (except removing 2 mobile-specific email state vars)
- All render helper functions (renderAIScript, renderStaticScript, renderPersona, renderTargetedResearch)
- `renderHistory` function (though it won't be called via sectionRenderers anymore — called directly in JSX)
- SocialLinkButton component
- All AI logic, webhook logic, auto-generate logic
- The `sectionOrder` / `sectionExpandedDefaults` hook call (kept for later cleanup)
- Delete dialog JSX

---

### Files changed
- `src/components/ContactCard.tsx` only — no other files
