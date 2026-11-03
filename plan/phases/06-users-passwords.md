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
- [ ] Admin can run the whole user lifecycle in the browser; demo seed creates an admin + one user per role.
- [ ] `CLAUDE.md` updated (roles, user management, CLI scripts).

## Out of scope
Per-project assignment (v3).

## Found during phase
