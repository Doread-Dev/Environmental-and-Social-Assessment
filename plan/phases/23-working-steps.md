# Phase 23 — Tools 3–5 on the step pattern (v2.5)

**Goal:** the working steps: Management activities, Mitigation plan and Monitoring, as working
tables on the step pattern, with the row editor, problems on the rows, monitoring gaps and pasting
from Excel.

**Decisions:** D88 (working steps, no approval), D90 (gaps, Excel paste), D87, D85.

**Design reference:** concept "Core pages", "Components, group 2" (working table), "Patterns, group
A" (filling in and saving) and "group B" (monitoring entry); playgrounds
[patterns-workflow](../design/patterns-workflow.html), [patterns-tasks](../design/patterns-tasks.html),
[components-data](../design/components-data.html), [core-pages](../design/core-pages.html).

**Depends on:** 22.

## Scope
1. **Tools 3 and 4:** working table with long text clamped to three lines, the row editor side panel
   (all fields, previous / next, responsible staff or external party), edited-row bar, problem cells
   written in the cell ("Add a description": Tool 5 opens when every row has one), "Only rows with
   problems"; main action "Add row", or "Save changes" while there are unsaved changes; empty state
   with the first action.
2. **Tool 5 Monitoring:** grid of indicators × Baseline, Q1–Q4 (+ total, ranking, responsible),
   every column open; gaps from the server marked in the cell (dashed border, icon, the word "Gap"),
   a strip with the count and "Show only gaps"; spreadsheet keys (Tab next column, Enter down,
   arrows); **pasting a block copied from Excel** into the cells it covers, tinted until saved, with
   Undo, cut at the last column with a message; values kept as typed.
3. **Phone:** rows become cards; a row opens full screen with previous / next; each indicator a
   card with its five values and gaps.
4. **Exports** of Tools 3–5 from the header (the save-before-export dialog of D74 3 kept).
5. Takes the items of these screens from [the findings list](ui-findings.md).

## Tests
- Tools 3/4: add, edit in the panel, previous / next, problem cells and filter, main action switch,
  save and the stale-save list.
- Locked Tool 5 says what opens it; it opens once every row of Tools 3 and 4 has a description.
- Gaps: marked cells and the count match the server; "Show only gaps" filters.
- Paste: a 3×4 block from the clipboard fills the right cells; a wider block is cut and announced;
  Undo restores; nothing outside the grid changes; free text kept.
- Keyboard: Tab / Enter / arrows move as described, in both directions of text.
- Phone cards; both languages and themes; icons on the text line; nothing clipped.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Frontend tests, lint, Prettier, build; E2E flows for Tools 3–5 updated and run; coverage floors
      raised.
- [ ] Old Tools 3–5 pages and layouts removed (listed in Result).
- [ ] The owner has walked the three tools, including a paste from a real Excel file.

## Found during phase
