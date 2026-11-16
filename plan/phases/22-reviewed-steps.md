# Phase 22 — The step pattern and Tools 1–2 (v2.5)

**Goal:** the generic workflow-step page and the two reviewed tools on it: Screening and Assessment
(Context, Methods and consultation, Scoring, Summary and submit), with submitting, reviewing,
returning, reopening and review history.

**Decisions:** D88, D85 (one page for reading and editing), D83, D87.

**Design reference:** concept "Core pages" (workflow step page), "Patterns, group A";
playgrounds [patterns-workflow](../design/patterns-workflow.html), [core-pages](../design/core-pages.html).

**Depends on:** 20, 18.

## Scope
1. **Step page (generic):** header (tool number and name or part, state, who/when, Export, one main
   action by state and permission, "⋯"), status strip in its fixed place (returned with reason and
   reviewer; submitted, locked; approved with recommendations; reopened), body, save bar under the
   content while editable. Built from the server's step contract (kind, state, missing, allowed
   actions), not from tool numbers, so SEMP Plan and Stakeholder Awareness reuse it.
2. **Read mode:** the same page without inputs; the separate summary and review pages go.
3. **Tool 1 Screening:** category cards A–F with their meaning, reason, impacts.
4. **Tool 2 Assessment:** four parts in the spine; scoring with questions grouped by category, the
   level as visible buttons and a sticky summary; Summary and submit with the "Before you submit"
   checklist.
5. **Submit:** saves pending changes and submits in one press; missing items → summary at the top
   linking to each part and field; after submit the info strip says who was notified.
6. **Review:** "Review" opens the side panel (Approve with required recommendations / Return with
   required reason), the sentence of what will happen, the button repeating the decision.
7. **Reopen:** "Reopen…" under "⋯" for people who can approve an approved step: dialog with the
   required reason, focus on Cancel.
8. **Review history** side panel from the step's history.
9. Takes the items of these screens from [the findings list](ui-findings.md).

## Tests
- Main action per state and permission (editor, approver, both, reader) for both tools.
- Read mode has no inputs; an editor in Draft has inputs and the save bar.
- Submit with missing items: focus moves to the summary; links reach the part and field; the codes
  match the checklist.
- Review panel: approve without recommendations and return without a reason are refused at the
  field; success updates the strip and removes the item from "Waiting for your review".
- Reopen: only for approvers on an approved step; reason required; the step shows Returned with the
  reason; history lists the reopen.
- Stale save on a Tool 2 part: the changes list appears (shared handler from phase 16).
- Both languages and themes, three widths; icons on the text line; nothing clipped.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Frontend tests, lint, Prettier, build; E2E flows 1–5 updated and run; coverage floors raised.
- [ ] Old Tool 1–2 pages, summary and review pages removed (listed in Result).
- [ ] The owner has walked both tools through every state.

## Found during phase
