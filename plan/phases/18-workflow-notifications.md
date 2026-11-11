# Phase 18 — Workflow additions and notifications (v2.5, backend)

**Goal:** the server gives the v2.5 step pattern everything it draws, adds the reopen and return
rules, computes monitoring gaps, gives projects a code, and sends in-app notifications.

**Decisions:** D88, D90, D93 (+ D16, D30, D74 5, D82 for the "needs a team" notice).

**Design reference:** concept "Patterns, group A: the workflow cycle", "Monitoring reminders: gaps,
not dates", "Lists" (Notifications page); playgrounds [patterns-workflow](../design/patterns-workflow.html),
[components-nav](../design/components-nav.html) (bell panel).

**Depends on:** 17.

## Scope
1. **Step contract:** `computeWorkflow` returns per step its `kind` (`reviewed` or `working`), its
   state, what it is waiting for when locked (as a code), and **what is still missing to submit**
   (field codes, e.g. `environmental_setting`, `questions_unscored:2`), so the "Before you submit"
   checklist and the submit error use the same list. The submit check itself stays as today (D74 2).
2. **Return needs a reason:** reject without `reject_reason` → 400 (code). Approve keeps requiring
   recommendations.
3. **Reopen:** `PATCH /<screenings|assessments>/:id/reopen` for people who can approve, `approved` →
   `rejected` with a required reason; `status_history` gets `reopened` (by, at, note); later steps
   keep their data and follow the existing gates; no other transition changes.
4. **Review history:** the read of a screening/assessment returns `status_history` with names and
   roles at the time (already populated; check the shape the panel needs).
5. **Monitoring gaps:** computed with the workflow per indicator (an empty value before a later
   filled one, in the order Baseline, Q1–Q4; empty quarters at the end are not gaps); returned with
   the monitoring table and summarised per project for the home and the project list.
6. **Project code:** `ESMS-NNN`, given by the server on create (unique, never reused), searchable,
   in list/workspace responses and in exports.
7. **Notifications:** a `Notification` collection (recipient, event, project, target, actor, read
   at), created on: submitted (to people who can approve that project), returned, approved, reopened
   (to the submitter and editors of that step), new project needs a team (to access managers),
   access given (to the person). Endpoints: list (All / Unread, paging), unread count, mark one / all
   read. Only accessible projects. No notification for monitoring gaps. Email is out of scope
   (waits for IT).
8. **Docs:** workflow rules, API reference, data models.

## Tests
- Step contract: `kind` and `missing` for a screening and an assessment in each state; a submit that
  fails returns the same codes as `missing`.
- Reject without a reason → 400; with one → `rejected` + history note.
- Reopen: only from `approved`, only with a reason, only for people who can approve; history entry;
  Tools 3/4 become read only through the existing gates and open again after re-approval.
- Gaps: the cases of the concept (Baseline empty with Q1/Q2 filled; Q3 empty with Q4 filled; trailing
  empties are not gaps); the home summary counts them.
- Project code: sequential, unique under parallel creates, in search and exports.
- Notifications: each event creates the right recipients' items and nobody else's (a reader of
  another project gets none); unread count; mark read; a recipient who loses access no longer sees
  the item.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Backend and frontend tests, lint, Prettier; E2E run; coverage floors raised; demo seed creates
      a reopened round and a few notifications.
- [ ] Docs updated in the same change.

## Found during phase
