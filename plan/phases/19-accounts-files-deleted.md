# Phase 19 — Accounts, sessions, files and Deleted items (v2.5, backend)

**Goal:** the account and file changes the design needs: stronger passwords, idle sessions,
preferences on the account, last sign-in, site photos, a visible upload limit, and a 30-day Deleted
items area.

**Decisions:** D89 (Deleted items), D91, D92 (+ D17, D22, D47, D60, D65, D73 2).

**Design reference:** concept "Account, sign-in, readers and system pages", "Components, group 1"
(upload), "Lists, Administration" (Deleted items); playgrounds
[account-and-readers](../design/account-and-readers.html), [patterns-tasks](../design/patterns-tasks.html).

**Depends on:** 17.

## Scope
1. **Passwords:** at least 12 characters, no forced symbols or digits, refuse common and leaked
   passwords from a bundled list (offline; no online lookup); applies to new passwords, changes and
   temporary ones; the rules are returned for the live checklist.
2. **Sessions:** the session ends after 8 hours without activity (sliding expiry, replaces
   `JWT_EXPIRES_IN` 12 h from sign-in); the existing "session ended" dialog keeps working.
3. **Account:** `last_sign_in_at` on users; `language` (`en` / `ar`) and `theme` (`light` / `dark` /
   `system`) saved on the account, in `GET /auth/me`, changed by `PUT /auth/preferences`.
4. **Files:** image types JPG and PNG (HEIC checked: accept only if it can be shown offline, else
   refuse with a clear code), with the same signature check; `upload_rules` (types, current
   `MAX_UPLOAD_MB`) returned to the interface. Ask the owner whether the administrator should change
   the limit in the app and what default suits full reports with annexes; record the answer.
5. **Deleted items:** deleting a project (when allowed today), a project file or a library document
   becomes a soft delete with `deleted_at` / `deleted_by`; deleted items are hidden everywhere;
   restore and "delete now" endpoints; a daily job removes items older than 30 days (files from disk
   too); purge of an archived project (D60) stays a direct permanent delete. Each delete, restore
   and removal is logged (D65).
6. **Docs:** workflow rules (delete/archive/purge), API reference, data models, deploy notes (the
   daily removal job).

## Tests
- Passwords: 11 characters refused, 12 accepted, a listed common password refused, no symbol rule.
- Sessions: activity extends the session; 8 idle hours end it (time mocked).
- Preferences: saved and returned by `/auth/me`; invalid values refused.
- Last sign-in: set on a successful sign-in only.
- Files: a JPG and a PNG accepted; a renamed non-image refused by signature; the limit in
  `upload_rules` follows `MAX_UPLOAD_MB`.
- Deleted items: a deleted project, file and library document disappear from every list and read,
  can be restored, and are removed after 30 days (job test with mocked time, files removed from
  disk); every action logged; purge unchanged.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Backend and frontend tests, lint, Prettier; E2E run; deploy scripts test; coverage floors raised.
- [ ] Docs updated in the same change; the owner's answer on the upload limit recorded.

## Found during phase
