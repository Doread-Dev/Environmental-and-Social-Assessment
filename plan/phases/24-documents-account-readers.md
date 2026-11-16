# Phase 24 — Documents, Library, Notifications, account, sign-in, readers and system pages (v2.5)

**Goal:** the remaining pages outside the workflow and Administration, rebuilt from their patterns.

**Decisions:** D85, D90 (Notifications page), D91, D92, D81, D87 (+ D64, D78).

**Design reference:** concept "Lists, Administration and New project" (Library, Project documents,
Notifications), "Account, sign-in, readers and system pages", "Patterns, group B" (upload);
playgrounds [lists-and-admin](../design/lists-and-admin.html), [account-and-readers](../design/account-and-readers.html),
[patterns-tasks](../design/patterns-tasks.html), [foundations](../design/foundations.html) (brand panel).

**Depends on:** 20, 19.

## Scope
1. **Project documents:** grouped by workflow step in spine order, empty steps hidden; the upload
   side panel ("Attach to" prefilled, Choose files first, drop as a shortcut, "Take a photo" on
   phones, types and the server's limit written up front, per-file states, refused files with the
   reason and the fix); PDFs open in the viewer, photos as images, other files download; "Download
   all" as a ZIP; delete → Deleted items.
2. **Library:** list with "Shows on" (the pages whose Help panel lists it), upload and edit in a side
   panel (file, title, description, pages, position); "Read the library" as a permission.
3. **Notifications page:** All / Unread, "Mark all as read", each item a sentence that opens its
   place.
4. **My account:** Profile (read only), Preferences (language, theme: applied at once, saved on the
   account), Password (the live rules), My access (read only, whom to ask).
5. **Sign in:** brand panel (forest green, diamond lattice, the Syria map SVG, AKF logo) and the
   form; language switch in the corner; safe error wording; "Forgot your password?" telling the
   truth. **Forced password change** in the same card. **Session ended** dialog restyled.
6. **User guide (reader):** contents that follow the reading position, reading width, sections by
   permission (D78), **search inside the guide**, language switch, print; Contents behind a button on
   tablet and phone. The guide text is updated for the new screens in phase 26.
7. **PDF viewer** (bar with back, name, size, where it shows, Download, Open in new tab; "Open" and
   "Download" on phones). **System pages:** Not found, Server error with the reference code, the "no
   access" page, the offline bar.
8. Takes the items of these screens from [the findings list](ui-findings.md).

## Tests
- Upload: several files with one refused by type and one by size (limit from the server); the
  others finish; photos shown as images; "Attach to" required and prefilled.
- Library: "Shows on" lists the pages; edit in the panel; a reader without the permission does not
  see the Library.
- Notifications: filters, mark all read, an item opens its place.
- My account: preferences saved and applied at once; password rules ticked live; My access lists the
  assignments.
- Sign in: each error message; language switch before sign-in; forced change flow.
- Guide: search finds a term in the visible sections only; contents follow scrolling.
- Server error page shows the reference code from the response.
- Both languages and themes, three widths; icons on the text line; nothing clipped.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Frontend tests, lint, Prettier, build; E2E flows updated and run; coverage floors raised.
- [ ] Old pages removed (listed in Result).
- [ ] The owner has walked the pages.

## Found during phase
