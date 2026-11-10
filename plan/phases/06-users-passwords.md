# Phase 6 — Users & passwords

**Goal:** admins manage users without email or internet; everyone can change their own password.

**Decisions:** D4, D9, D21, D22, D23, D24 (done in phase 2), D25.

## Tasks

### Backend (D21, D22, D23)
- `GET /users` (admin: all incl. inactive; others: active users for pickers only, minimal fields).
- `POST /users`, `PUT /users/:id` (name, role, job title), `PATCH /users/:id/deactivate|reactivate`, `POST /users/:id/reset-password` → returns a one-time temporary password once, sets `must_change_password`.
- `PUT /auth/password` — change own password (current + new).
- When `must_change_password` is true, every endpoint except `/auth/me`, `/auth/password`, logout returns 403 with a clear code.
- Admin cannot deactivate or demote the last active admin.
- User management moves to `admin` only (specialist loses it).

### Frontend
- Settings → Users: list (active/inactive filter), create, edit, deactivate/reactivate, reset password (show the temporary password once with a copy button).
- Profile page: change password.
- Forced "change password" screen after login when `must_change_password`.
- Login page: replace "Forgot password?" with "Contact your system administrator" (D25).
- Inactive users hidden from all "responsible" pickers (D4).

## Tests
- Each endpoint × role; last-admin protection; temporary password works once and forces change; old token after deactivate rejected.
- Frontend: forced-change redirect; users table actions.

## Done when
- [x] Admin can run the whole user lifecycle in the browser; demo seed creates an admin + one user per role.
- [x] `CLAUDE.md` updated (roles, user management, CLI scripts).

## Out of scope
Per-project assignment (v3).

## Found during phase

Choices made in this phase (tell the owner; change them if they disagree):
- **New accounts get a temporary password too**, like a reset (D22): the admin form has no password field, and the user picks their own at first sign-in (phase 12 E2E expects this). This also removed the password rules from the frontend form.
- **"Works once"** = the temporary password works until the user changes it (forced at once), and every new reset replaces the previous one. It is not limited to a single login, so a user who closes the browser before changing it is not locked out.
- **Admins may create other admins** (the old rule "admin cannot be registered through the API" existed because specialists could register users). `POST /auth/register` is removed; `POST /users` replaces it.
- **Password policy stays at 6 characters** (phase 3: security, not a D57 text rule). It now comes from the backend (`password_rules` in `GET /auth/me`); the login form only requires a value.
- **Settings stays open to specialists** for the Projects section (project deletion); the Users section is admin only.
- The break-glass `reset-password.js` clears a pending forced change; `create-admin.js` does not set one (the operator chose the password).

Found outside scope (not fixed):
- There is no logout endpoint (logout is client-side), so the "except logout" in the tasks needs nothing.
- Changing your own password does not end your other sessions: older tokens stay valid until they expire (no token version). An admin reset does block them (forced change, and the temporary password is unknown to the old session).
- `window.confirm` returns `false` at once, without showing anything, in some embedded browsers (the desktop app's browser pane does this), so any button behind it silently does nothing there. Settings → Users now asks in an in-app dialog (`ConfirmUserActionModal`). Older code still uses `window.confirm`: project delete in Settings → Projects, the "unsaved changes" prompts in Tools 3, 4 and 5, and "export empty?" in Tool 3. One shared confirm dialog belongs in phase 10a (D61).
- The demo seed now needs an admin login (`DEV_ADMIN_*` added to the local `backend/.env`); the old `DEV_LOGIN_*` specialist still works for everything else.
